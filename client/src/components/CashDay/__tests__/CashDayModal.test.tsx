import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import type { CashDayType } from 'shared-ts';
import CashDayModal from '../index';
import { render } from '../../../utils/testUtils';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts ? `${key} ${JSON.stringify(opts)}` : key,
    i18n: { language: 'fr' },
  }),
}));
jest.mock('react-toastify', () => ({ toast: { error: jest.fn() } }));
jest.mock(
  '../../OrderHistoryModal',
  () => (props: { isOpen: boolean; cashDay?: { id: number } }) =>
    props.isOpen ? <div data-testid="day-orders">{props.cashDay?.id}</div> : null
);

let mockCurrent: CashDayType | null = null;
const mockStart = jest.fn();
jest.mock('../../../hooks/useCashDay', () => ({
  useCurrentCashDay: () => ({
    cashDay: mockCurrent,
    isNone: mockCurrent === null,
    isKnown: true,
    refetch: jest.fn(),
  }),
  useStartCashDay: () => ({ start: mockStart, isLoading: false }),
}));

let mockClosedDays: CashDayType[] = [];
const mockCloseCashDay = jest.fn();
jest.mock('../../../services/cashDays', () => ({
  useGetClosedCashDaysQuery: () => ({ data: mockClosedDays, refetch: jest.fn() }),
  useCloseCashDayMutation: () => [mockCloseCashDay, { isLoading: false }],
}));

const openedAt = new Date(2026, 10, 23, 8, 30).getTime();
const day = (overrides: Partial<CashDayType> = {}): CashDayType => ({
  id: 1,
  openedAt,
  closedAt: null,
  summary: { total: 1050, cashAmount: 800, cardAmount: 250, orderCount: 3 },
  announced: null,
  modifiedAfterClose: false,
  ...overrides,
});

describe('CashDayModal (D-061)', () => {
  afterEach(() => {
    mockCurrent = null;
    mockClosedDays = [];
    window.APP_CONFIG = undefined;
    jest.clearAllMocks();
  });

  it('starts the day in one tap when none is open', () => {
    render(<CashDayModal isOpen onClose={jest.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'cash_day.start' }));
    expect(mockStart).toHaveBeenCalled();
    expect(screen.getByText('cash_day.past_empty')).toBeInTheDocument();
  });

  it('shows the net total, cash, card and orders of the open day in euros', () => {
    window.APP_CONFIG = { VITE_CURRENCY: 'EUR' };
    mockCurrent = day();
    render(<CashDayModal isOpen onClose={jest.fn()} />);
    const summary = screen.getByTestId('cash-day-summary');
    expect(summary).toHaveAttribute('role', 'status');
    expect(summary).toHaveTextContent('10,50');
    expect(summary).toHaveTextContent('payment_cash');
    expect(summary).toHaveTextContent('8,00');
    expect(summary).toHaveTextContent('payment_card');
    expect(summary).toHaveTextContent('2,50');
    expect(summary).toHaveTextContent('cash_day.order_count {"count":3}');
  });

  it('shows no cash / card rows in tokens (answer 5 a)', () => {
    mockCurrent = day({
      summary: { total: 42, cashAmount: null, cardAmount: null, orderCount: 2 },
    });
    render(<CashDayModal isOpen onClose={jest.fn()} />);
    const summary = screen.getByTestId('cash-day-summary');
    expect(summary).not.toHaveTextContent('payment_cash');
    expect(summary).not.toHaveTextContent('payment_card');
  });

  it('closes the day after a confirmation, then shows the recap (answer 7 a)', async () => {
    window.APP_CONFIG = { VITE_CURRENCY: 'EUR' };
    mockCurrent = day();
    const closed = day({ closedAt: openedAt + 3600_000, announced: day().summary });
    mockCloseCashDay.mockReturnValue({ unwrap: () => Promise.resolve(closed) });
    render(<CashDayModal isOpen onClose={jest.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'cash_day.close' }));
    const confirmation = await screen.findByRole('dialog', {
      name: 'cash_day.close_confirm_title',
    });
    expect(within(confirmation).getByTestId('cash-day-summary')).toHaveTextContent('10,50');
    const buttons = within(confirmation).getAllByRole('button', { name: /cancel|cash_day.close/ });
    expect(buttons.map((b) => b.textContent)).toEqual(['cancel', 'cash_day.close']);

    fireEvent.click(within(confirmation).getByRole('button', { name: 'cash_day.close' }));
    await waitFor(() => expect(mockCloseCashDay).toHaveBeenCalled());
    const recap = await screen.findByTestId('cash-day-closed-recap');
    expect(recap).toHaveTextContent('cash_day.closed_title');
    // "Fermer" is the only button of the recap.
    expect(
      within(recap)
        .getAllByRole('button')
        .map((b) => b.textContent)
    ).toEqual(['close']);
  });

  it('lists the closed days, flags a change after the close, and opens their orders', () => {
    window.APP_CONFIG = { VITE_CURRENCY: 'EUR' };
    mockClosedDays = [
      day({
        id: 7,
        closedAt: new Date(2026, 10, 23, 22, 15).getTime(),
        announced: { total: 1050, cashAmount: 800, cardAmount: 250, orderCount: 3 },
        summary: { total: 800, cashAmount: 800, cardAmount: 0, orderCount: 2 },
        modifiedAfterClose: true,
      }),
    ];
    render(<CashDayModal isOpen onClose={jest.fn()} />);

    const list = screen.getByTestId('past-cash-days');
    expect(list).toHaveTextContent('23/11 · 08:30 – 22:15');
    expect(list).toHaveTextContent('8,00');
    expect(within(list).getByTestId('cash-day-modified')).toHaveTextContent('10,50');

    fireEvent.click(within(list).getByRole('button', { name: /cash_day.past_open_aria/ }));
    expect(screen.getByTestId('day-orders')).toHaveTextContent('7');
  });
});
