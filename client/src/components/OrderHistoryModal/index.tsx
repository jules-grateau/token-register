import React, { useEffect, useState } from 'react';
import { useGetOrdersQuery, useRemoveOrderMutation } from '../../services/orders';
import CartItem from '../Cart/CartItem';
import Loader from '../Loader';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import ConfirmationModal from '../ConfirmationModal';
import { useCurrency } from '../../hooks/useCurrency';
import { isPhoneMode, useLayoutMode } from '../../hooks/useLayoutMode';
import { IconCash, IconCreditCard, IconTrash } from '@tabler/icons-react';
import type { CashDayType, OrderPaymentType } from 'shared-ts';
import { useGetCashDayOrdersQuery, useRemoveCashDayOrderMutation } from '../../services/cashDays';
import { useCurrentCashDay } from '../../hooks/useCashDay';
import { formatDayDate } from '../../utils/cashDay';
import classes from './OrderHistoryModal.module.css';

import {
  Modal,
  Button,
  Stack,
  Group,
  Text,
  Card,
  ScrollArea,
  Divider,
  Center,
  Pagination,
  Badge,
} from '@mantine/core';

interface OrderHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  /**
   * D-061 (answer 16 a): the orders of this closed day, from "Journées passées", where they can
   * be deleted. Without it, the history: the open day's orders only (answer 15 a).
   */
  cashDay?: CashDayType;
}

const OrderHistoryModal: React.FC<OrderHistoryModalProps> = ({ isOpen, onClose, cashDay }) => {
  const { t, i18n } = useTranslation();
  const { currency, format } = useCurrency();
  const isPhone = isPhoneMode(useLayoutMode());
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;
  const historyQuery = useGetOrdersQuery({ page: currentPage, pageSize }, { skip: !!cashDay });
  const dayQuery = useGetCashDayOrdersQuery(
    { cashDayId: cashDay?.id ?? 0, page: currentPage, pageSize },
    { skip: !cashDay }
  );
  const ordersQuery = cashDay ? dayQuery : historyQuery;
  const { data: ordersData, isFetching, error } = ordersQuery;
  const { isNone: noOpenDay } = useCurrentCashDay();
  const [removeHistoryOrder, { isLoading: isRemoveHistoryLoading }] = useRemoveOrderMutation();
  const [removeDayOrder, { isLoading: isRemoveDayLoading }] = useRemoveCashDayOrderMutation();
  const isRemoveLoading = isRemoveHistoryLoading || isRemoveDayLoading;
  const removeOrder = (id: number) =>
    cashDay ? removeDayOrder({ cashDayId: cashDay.id, orderId: id }) : removeHistoryOrder(id);
  const [selectedOrder, setSelectedOrder] = useState(0);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCurrentPage(1);
      void ordersQuery.refetch();
    }
  }, [isOpen]);

  const onRemoveOrder = (id: number) => {
    setSelectedOrder(id);
    setIsConfirmationModalOpen(true);
  };

  const onConfirmRemoveOrder = async (id: number) => {
    if (isRemoveLoading) return;
    try {
      await removeOrder(id).unwrap();
      toast.success(t('order_removed', { id }));
      setIsConfirmationModalOpen(false);
    } catch (error) {
      toast.error(t('error_removing_order', { error: String(error) }), { autoClose: 5000 });
    } finally {
      await ordersQuery.refetch();
    }
  };

  // Payment badges (D-034): one per recorded mode, EUR instances only; none for older orders.
  const renderPayment = (payment: OrderPaymentType | null) => {
    if (currency !== 'EUR' || !payment) return null;
    const modes = [
      { amount: payment.cashAmount, mode: t('payment_cash'), icon: <IconCash size={16} /> },
      { amount: payment.cardAmount, mode: t('payment_card'), icon: <IconCreditCard size={16} /> },
    ].filter((entry) => entry.amount !== null);
    if (modes.length === 0) return null;
    return (
      <Group gap="xs" data-testid="order-payment">
        {modes.map(({ amount, mode, icon }) => (
          <Badge
            key={mode}
            size="lg"
            variant="default"
            tt="none"
            fz={14}
            fw={600}
            leftSection={icon}
            style={{ whiteSpace: 'nowrap' }}
          >
            {t('payment_badge', { mode, amount: format(amount ?? 0) })}
          </Badge>
        ))}
      </Group>
    );
  };

  const renderContent = () => {
    if (isFetching) {
      return (
        <Center h={200}>
          {' '}
          <Loader isLoading={true} />
        </Center>
      );
    }

    if (error) {
      return <Text className={classes.error}>{t('error_loading_orders')}</Text>;
    }

    if (ordersData && ordersData.data && ordersData.data.length > 0) {
      return (
        <ScrollArea.Autosize>
          <Stack>
            {ordersData.data.map((order) => {
              const totalPrice = order.items.reduce(
                (acc, item) => acc + (item.productPrice * item.quantity - item.discountedAmount),
                0
              );
              const totalItems = order.items.reduce((acc, item) => acc + item.quantity, 0);
              return (
                <Card withBorder radius="lg" key={order.id}>
                  <Stack gap="sm">
                    <Stack gap={2}>
                      <Text size="md" fw={700}>
                        {t('order_title', { id: order.id })}
                      </Text>
                      <Text size="sm" className={classes.secondary}>
                        {new Date(order.date).toLocaleString()}
                      </Text>
                    </Stack>
                    <Stack gap={0}>
                      {order.items.map((item, itemIndex) => (
                        <CartItem
                          key={itemIndex}
                          showQuantity
                          item={{
                            product: {
                              id: item.productId ?? 0,
                              name: item.productName,
                              price: item.productPrice,
                              categoryId: 0,
                            },
                            quantity: item.quantity,
                            discountedAmount: item.discountedAmount,
                          }}
                        />
                      ))}
                    </Stack>
                    {renderPayment(order.payment ?? null)}
                    <Divider />
                    <Group justify="space-between" wrap="nowrap">
                      <Group gap="sm" wrap="nowrap">
                        <Text fz={18} fw={800} className={classes.amount}>
                          {format(totalPrice)}
                        </Text>
                        <Text size="md" className={classes.secondary}>
                          {totalItems} {t('items', { count: totalItems })}
                        </Text>
                      </Group>
                      {/* D-020: deletion is kept, behind the existing confirmation. */}
                      <Button
                        onClick={() => onRemoveOrder(order.id)}
                        color="red"
                        variant="light"
                        h={44}
                        leftSection={<IconTrash size={20} />}
                        style={{ flex: 'none' }}
                      >
                        {t('delete')}
                      </Button>
                    </Group>
                  </Stack>
                </Card>
              );
            })}
          </Stack>
        </ScrollArea.Autosize>
      );
    }

    // Answer 15 a: without an open day, the history is empty and says why.
    if (!cashDay && noOpenDay) return <Text>{t('cash_day.indicator_none')}</Text>;
    return <Text>{t('no_orders')}</Text>;
  };

  return (
    <>
      <Modal
        opened={isOpen}
        onClose={onClose}
        title={
          cashDay
            ? t('cash_day.orders_title', { date: formatDayDate(cashDay.openedAt, i18n.language) })
            : t('order_history')
        }
        size="lg"
        centered
        fullScreen={isPhone}
        closeButtonProps={{ size: 44, 'aria-label': t('close') }}
        classNames={{ content: classes.content, header: classes.header }}
      >
        {renderContent()}
        {ordersData && ordersData.pagination && ordersData.pagination.totalPages > 1 && (
          <Stack mt="md" gap="sm">
            <Pagination
              value={currentPage}
              onChange={setCurrentPage}
              total={ordersData.pagination.totalPages}
              siblings={1}
              boundaries={1}
              gap={8}
              classNames={{ control: classes.control, dots: classes.dots }}
              style={{ alignSelf: 'center' }}
            />
            <Text size="sm" ta="center" className={classes.secondary}>
              {t('showing', {
                count: ordersData.data.length,
                total: ordersData.pagination.totalCount,
              })}
            </Text>
          </Stack>
        )}
      </Modal>
      <ConfirmationModal
        isOpen={isConfirmationModalOpen}
        onClose={() => setIsConfirmationModalOpen(false)}
        onConfirm={() => void onConfirmRemoveOrder(selectedOrder)}
        title={t('confirmation')}
        confirmButtonText={t('delete')}
        destructive
      >
        <Stack align="center">
          {isRemoveLoading && <Loader isLoading={true} />}
          <Text>{t('order_removal_confirmation', { id: selectedOrder })}</Text>
        </Stack>
      </ConfirmationModal>
    </>
  );
};

export default OrderHistoryModal;
