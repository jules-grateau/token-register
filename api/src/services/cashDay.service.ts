import type { Database } from 'sqlite';
import type { CashDaySummaryType, CashDayType, CurrencyCode } from 'shared-ts';
import { openDb } from '../db';
import { getOpenCashDayId, rollbackQuietly } from '../db/cashDays';
import logger from '../utils/logger';
import { getConfiguredCurrency } from '../utils/currency';
import { ConflictError, NotFoundError } from '../types/errors';

/** D-061 (tech-lead): the list of closed days is bounded. */
export const MAX_CLOSED_CASH_DAYS = 50;

interface CashDayRow {
  id: number;
  opened_at: number;
  closed_at: number | null;
  closed_total: number | null;
  closed_cash_amount: number | null;
  closed_card_amount: number | null;
  closed_order_count: number | null;
}

interface SummaryRow {
  cash_day_id: number;
  order_count: number;
  total: number | null;
  cash_amount: number | null;
  card_amount: number | null;
}

const CASH_DAY_COLUMNS =
  'id, opened_at, closed_at, closed_total, closed_cash_amount, closed_card_amount, closed_order_count';

/**
 * Net total of each order from its lines (refunds and negative orders deducted, D-061 answer
 * 4 a), and the payment split (D-034). Integer sums in the smallest unit: no float rounding.
 * A line without a recorded price counts 0 (D-056).
 */
const summariesSql = (count: number) => `
  SELECT
    orders.cash_day_id AS cash_day_id,
    COUNT(*) AS order_count,
    SUM(COALESCE(lines.total, 0)) AS total,
    SUM(orders.cash_amount) AS cash_amount,
    SUM(orders.card_amount) AS card_amount
  FROM orders
  LEFT JOIN (
    SELECT order_id, SUM(COALESCE(product_price, 0) * quantity - discountedAmount) AS total
    FROM order_items
    GROUP BY order_id
  ) AS lines ON lines.order_id = orders.id
  WHERE orders.cash_day_id IN (${new Array(count).fill('?').join(', ')})
  GROUP BY orders.cash_day_id`;

export class CashDayService {
  constructor(private readonly currency: CurrencyCode = getConfiguredCurrency()) {}

  /**
   * Live totals of a day. Token instances record no payment: no cash / card split (D-033,
   * answer 5 a). In euros, a day whose orders all lack a payment (converted from tokens, D-036)
   * has no split either.
   */
  private toSummary(row: SummaryRow | undefined): CashDaySummaryType {
    const orderCount = row?.order_count ?? 0;
    const cash = row?.cash_amount ?? null;
    const card = row?.card_amount ?? null;
    const hasSplit =
      this.currency === 'EUR' && (orderCount === 0 || cash !== null || card !== null);
    return {
      total: row?.total ?? 0,
      cashAmount: hasSplit ? (cash ?? 0) : null,
      cardAmount: hasSplit ? (card ?? 0) : null,
      orderCount,
    };
  }

  private async loadSummaries(db: Database, ids: number[]): Promise<Map<number, SummaryRow>> {
    if (ids.length === 0) return new Map();
    const rows = await db.all<SummaryRow[]>(summariesSql(ids.length), ids);
    return new Map(rows.map((row) => [row.cash_day_id, row]));
  }

  private toCashDay(row: CashDayRow, summaryRow: SummaryRow | undefined): CashDayType {
    const summary = this.toSummary(summaryRow);
    const announced: CashDaySummaryType | null =
      row.closed_at === null
        ? null
        : {
            total: row.closed_total ?? 0,
            cashAmount: this.currency === 'EUR' ? row.closed_cash_amount : null,
            cardAmount: this.currency === 'EUR' ? row.closed_card_amount : null,
            orderCount: row.closed_order_count ?? 0,
          };
    return {
      id: row.id,
      openedAt: row.opened_at,
      closedAt: row.closed_at,
      summary,
      announced,
      // Answer 17 a: an order can only be deleted after the close, never added.
      modifiedAfterClose: announced !== null && summary.orderCount !== announced.orderCount,
    };
  }

  private async withDays(db: Database, rows: CashDayRow[]): Promise<CashDayType[]> {
    const summaries = await this.loadSummaries(
      db,
      rows.map((row) => row.id)
    );
    return rows.map((row) => this.toCashDay(row, summaries.get(row.id)));
  }

  private async readDay(db: Database, id: number): Promise<CashDayType | null> {
    const row = await db.get<CashDayRow>(`SELECT ${CASH_DAY_COLUMNS} FROM cash_days WHERE id = ?`, [
      id,
    ]);
    if (!row) return null;
    const [day] = await this.withDays(db, [row]);
    return day;
  }

  /** The open day with its live totals, or null when none is open. */
  async getCurrent(): Promise<CashDayType | null> {
    const db = await openDb();
    try {
      const id = await getOpenCashDayId(db);
      return id === null ? null : await this.readDay(db, id);
    } finally {
      await db.close();
    }
  }

  async getById(id: number): Promise<CashDayType> {
    const db = await openDb();
    try {
      const day = await this.readDay(db, id);
      if (!day) throw new NotFoundError(`Cash day ${id} not found`);
      return day;
    } finally {
      await db.close();
    }
  }

  /** Closed days, most recent first, at most MAX_CLOSED_CASH_DAYS (answer 6 a). */
  async listClosed(): Promise<CashDayType[]> {
    const db = await openDb();
    try {
      const rows = await db.all<CashDayRow[]>(
        `SELECT ${CASH_DAY_COLUMNS} FROM cash_days
         WHERE closed_at IS NOT NULL
         ORDER BY closed_at DESC, id DESC
         LIMIT ?`,
        [MAX_CLOSED_CASH_DAYS]
      );
      return await this.withDays(db, rows);
    } finally {
      await db.close();
    }
  }

  /**
   * Opens a day (one tap, no confirmation: answer 7). Refused while a day is open; the unique
   * index of cash_days also refuses a second open day if two requests race.
   */
  async open(): Promise<CashDayType> {
    const db = await openDb();
    try {
      await db.exec('BEGIN IMMEDIATE');
      if ((await getOpenCashDayId(db)) !== null) {
        throw alreadyOpen();
      }
      let id: number | undefined;
      try {
        ({ lastID: id } = await db.run('INSERT INTO cash_days (opened_at) VALUES (?)', [
          Date.now(),
        ]));
      } catch (error) {
        if (String(error).includes('UNIQUE constraint failed')) throw alreadyOpen();
        throw error;
      }
      if (!id) throw new Error('Failed to create the cash day.');
      await db.exec('COMMIT');
      logger.info('Cash day %s opened', id);
      const day = await this.readDay(db, id);
      if (!day) throw new Error('Cash day not found after opening.');
      return day;
    } catch (error) {
      await rollbackQuietly(db);
      throw error;
    } finally {
      await db.close();
    }
  }

  /**
   * Closes the open day and freezes its totals (answer 6 a), once: a second call (double tap)
   * finds no open day and is refused.
   */
  async closeCurrent(): Promise<CashDayType> {
    const db = await openDb();
    try {
      await db.exec('BEGIN IMMEDIATE');
      const id = await getOpenCashDayId(db);
      if (id === null) {
        throw new ConflictError('No cash day is open.', 'NO_OPEN_CASH_DAY');
      }
      const summary = this.toSummary((await this.loadSummaries(db, [id])).get(id));
      const result = await db.run(
        `UPDATE cash_days
         SET closed_at = ?, closed_total = ?, closed_cash_amount = ?, closed_card_amount = ?,
             closed_order_count = ?
         WHERE id = ? AND closed_at IS NULL`,
        [Date.now(), summary.total, summary.cashAmount, summary.cardAmount, summary.orderCount, id]
      );
      if (result.changes !== 1) {
        throw new ConflictError('No cash day is open.', 'NO_OPEN_CASH_DAY');
      }
      await db.exec('COMMIT');
      logger.info({ id, ...summary }, 'Cash day closed');
      const day = await this.readDay(db, id);
      if (!day) throw new Error('Cash day not found after closing.');
      return day;
    } catch (error) {
      await rollbackQuietly(db);
      throw error;
    } finally {
      await db.close();
    }
  }
}

const alreadyOpen = () =>
  new ConflictError(
    'A cash day is already open: close it before starting a new one.',
    'CASH_DAY_ALREADY_OPEN'
  );
