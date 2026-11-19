import { openDb, getDatabasePath } from '../index';
import logger from '../../utils/logger';
import {
  applyCurrencyConversion,
  describeConversionPlan,
  parseConvertCurrencyArgs,
  planCurrencyConversion,
} from '../currency';
import { getConfiguredCurrency } from '../../utils/currency';

/**
 * Admin command (D-009): converts the instance currency 1 for 1, catalog AND order history.
 *
 *   npm run prod:db:convert-currency -- --to=EUR          # preview only, writes nothing
 *   npm run prod:db:convert-currency -- --to=EUR --apply  # converts in one transaction
 *
 * TOKEN -> EUR: 3 -> 3,00 EUR. EUR -> TOKEN: nearest token, .5 away from zero.
 * Back up the database before running with --apply. See deploy/README.md.
 */
async function convertCurrency() {
  const { to, apply } = parseConvertCurrencyArgs(process.argv.slice(2));
  const db = await openDb();
  try {
    const plan = await planCurrencyConversion(db, to);

    console.log(`Database: ${getDatabasePath()}`);
    if (plan.from === to) {
      console.log(`The database is already in ${to}. Nothing to convert.`);
      return;
    }

    describeConversionPlan(plan).forEach((line) => console.log(line));
    console.log('');

    if (!apply) {
      console.log('PREVIEW ONLY: nothing was written.');
      console.log('Back up the database, then run the same command with --apply.');
      return;
    }

    console.log('Reminder: make sure you have a backup of the database.');
    await applyCurrencyConversion(db, plan);
    logger.info({ from: plan.from, to }, 'Instance currency converted');
    console.log(`Done: the database is now in ${to}.`);

    let configured: string;
    try {
      configured = getConfiguredCurrency();
    } catch {
      configured = 'invalid';
    }
    if (configured !== to) {
      console.log(`Set CURRENCY=${to} for this instance before restarting it.`);
    }
  } finally {
    await db.close();
  }
}

void convertCurrency()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    logger.error('Currency conversion failed: %s', error);
    process.exit(1);
  });
