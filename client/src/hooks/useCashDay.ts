import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import type { CashDayType } from 'shared-ts';
import { useGetCurrentCashDayQuery, useOpenCashDayMutation } from '../services/cashDays';
import { extractApiErrorCode } from '../utils/extractApiError';

/**
 * The open cash day (D-061), refreshed when the tab comes back: several registers can share an
 * instance. `isNone` is true only once the API said that no day is open; while loading, or if
 * the API cannot be reached, nothing is blocked here (the API refuses the sale anyway).
 */
export function useCurrentCashDay(): {
  cashDay: CashDayType | null;
  isNone: boolean;
  isKnown: boolean;
  refetch: () => void;
} {
  const query = useGetCurrentCashDayQuery(undefined, {
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });
  const isKnown = query.data !== undefined;
  return {
    cashDay: query.data ?? null,
    isNone: isKnown && query.data === null,
    isKnown,
    refetch: () => void query.refetch(),
  };
}

/** "Démarrer la journée": one tap, no confirmation (answer 7). */
export function useStartCashDay(): { start: () => Promise<boolean>; isLoading: boolean } {
  const { t } = useTranslation();
  const [openCashDay, { isLoading }] = useOpenCashDayMutation();
  const start = useCallback(async () => {
    try {
      await openCashDay().unwrap();
      return true;
    } catch (error) {
      // Opened meanwhile on another register: the day is open, which is what was asked.
      if (extractApiErrorCode(error) === 'CASH_DAY_ALREADY_OPEN') return true;
      toast.error(t('cash_day.start_error'), { autoClose: 5000 });
      return false;
    }
  }, [openCashDay, t]);
  return { start, isLoading };
}
