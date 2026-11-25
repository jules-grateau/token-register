import React, { useEffect, useState } from 'react';
import { Button, Center, Divider, Group, Modal, ScrollArea, Stack, Text } from '@mantine/core';
import { IconCheck, IconPlayerPlay, IconPlayerStop } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import type { CashDayType } from 'shared-ts';
import { useCurrentCashDay, useStartCashDay } from '../../hooks/useCashDay';
import { isPhoneMode, useLayoutMode } from '../../hooks/useLayoutMode';
import { useCloseCashDayMutation, useGetClosedCashDaysQuery } from '../../services/cashDays';
import { extractApiErrorCode } from '../../utils/extractApiError';
import { formatDayDate, formatDayTime } from '../../utils/cashDay';
import ConfirmationModal from '../ConfirmationModal';
import OrderHistoryModal from '../OrderHistoryModal';
import Loader from '../Loader';
import CashDaySummaryCard from './CashDaySummaryCard';
import PastCashDays from './PastCashDays';
import classes from './CashDay.module.css';

interface CashDayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * "Journée de caisse" (D-061; docs/design/components.md): start the day, follow its totals,
 * close it after a confirmation that shows the final totals, and browse the closed days.
 */
const CashDayModal: React.FC<CashDayModalProps> = ({ isOpen, onClose }) => {
  const { t, i18n } = useTranslation();
  const isPhone = isPhoneMode(useLayoutMode());
  const { cashDay, isKnown, refetch } = useCurrentCashDay();
  const { start, isLoading: isStarting } = useStartCashDay();
  const closedDays = useGetClosedCashDaysQuery();
  const [closeCashDay, { isLoading: isClosing }] = useCloseCashDayMutation();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  // Recap shown once the day is closed, until the modal is closed (answer 7 a).
  const [closedRecap, setClosedRecap] = useState<CashDayType | null>(null);
  // Closed day whose orders are listed; kept while its modal closes (transition).
  const [selectedDay, setSelectedDay] = useState<CashDayType | null>(null);
  const [isDayOrdersOpen, setIsDayOrdersOpen] = useState(false);
  const showDayOrders = (day: CashDayType) => {
    setSelectedDay(day);
    setIsDayOrdersOpen(true);
  };

  // "À tout moment": fresh totals at each opening (another register may have sold meanwhile).
  // The previous figures stay on screen until the new ones arrive: no full-screen loader.
  useEffect(() => {
    if (isOpen) {
      setClosedRecap(null);
      refetch();
      void closedDays.refetch();
    }
    // Only when the modal opens: the refetch functions change on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const confirmClose = async () => {
    if (isClosing) return;
    try {
      const closed = await closeCashDay().unwrap();
      setClosedRecap(closed);
      setIsConfirmOpen(false);
    } catch (error) {
      setIsConfirmOpen(false);
      // Closed meanwhile on another register: the modal shows the fresh state.
      if (extractApiErrorCode(error) !== 'NO_OPEN_CASH_DAY') {
        toast.error(t('cash_day.close_error'), { autoClose: 5000 });
      }
    }
  };

  const language = i18n.language;
  const openedLine = (day: CashDayType) =>
    t('cash_day.opened_at', {
      date: formatDayDate(day.openedAt, language),
      time: formatDayTime(day.openedAt, language),
    });

  const renderCurrent = () => {
    if (closedRecap) {
      return (
        <Stack gap="md" data-testid="cash-day-closed-recap">
          <Group gap="sm" wrap="nowrap">
            <IconCheck size={28} color="var(--color-success)" aria-hidden />
            <Text fz={20} fw={800}>
              {t('cash_day.closed_title')}
            </Text>
          </Group>
          <Text fz={16} className={classes.secondary}>
            {openedLine(closedRecap)}
            {closedRecap.closedAt !== null &&
              ` · ${t('cash_day.closed_at', {
                date: formatDayDate(closedRecap.closedAt, language),
                time: formatDayTime(closedRecap.closedAt, language),
              })}`}
          </Text>
          <CashDaySummaryCard summary={closedRecap.announced ?? closedRecap.summary} />
          <Button h={56} fz={18} fw={800} fullWidth onClick={onClose}>
            {t('close')}
          </Button>
        </Stack>
      );
    }
    if (!isKnown) {
      return (
        <Center mih={112}>
          <Loader isLoading={true} />
        </Center>
      );
    }
    if (!cashDay) {
      return (
        <Stack gap="md">
          <Text fz={16} className={classes.secondary}>
            {t('cash_day.start_help')}
          </Text>
          <Button
            h={56}
            fz={18}
            fw={800}
            fullWidth
            loading={isStarting}
            leftSection={<IconPlayerPlay size={22} aria-hidden />}
            onClick={() => void start()}
          >
            {t('cash_day.start')}
          </Button>
        </Stack>
      );
    }
    return (
      <Stack gap="md">
        <Text fz={16} className={classes.secondary}>
          {openedLine(cashDay)}
        </Text>
        <CashDaySummaryCard summary={cashDay.summary} live />
        <Button
          variant="default"
          h={56}
          fz={18}
          fw={800}
          fullWidth
          leftSection={<IconPlayerStop size={22} aria-hidden />}
          onClick={() => setIsConfirmOpen(true)}
        >
          {t('cash_day.close')}
        </Button>
      </Stack>
    );
  };

  return (
    <>
      <Modal
        opened={isOpen}
        onClose={onClose}
        title={t('cash_day.title')}
        size="lg"
        centered
        fullScreen={isPhone}
        closeButtonProps={{ size: 44, 'aria-label': t('close') }}
        classNames={{ content: classes.content, header: classes.header, body: classes.body }}
        scrollAreaComponent={ScrollArea.Autosize}
      >
        <Stack gap="lg">
          {renderCurrent()}
          <Divider />
          <PastCashDays days={closedDays.data} onSelect={showDayOrders} />
        </Stack>
      </Modal>
      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => !isClosing && setIsConfirmOpen(false)}
        onConfirm={() => void confirmClose()}
        title={t('cash_day.close_confirm_title')}
        confirmButtonText={t('cash_day.close')}
        loading={isClosing}
        stacked={isPhone}
      >
        <Stack gap="sm">
          <Text fz={16}>{t('cash_day.close_confirm_text')}</Text>
          {cashDay && <CashDaySummaryCard summary={cashDay.summary} />}
        </Stack>
      </ConfirmationModal>
      {selectedDay && (
        <OrderHistoryModal
          isOpen={isDayOrdersOpen}
          onClose={() => setIsDayOrdersOpen(false)}
          cashDay={selectedDay}
        />
      )}
    </>
  );
};

export default CashDayModal;
