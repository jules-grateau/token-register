import React, { useEffect, useState } from 'react';
import { useGetOrdersQuery, useRemoveOrderMutation } from '../../services/orders';
import CartItem from '../Cart/CartItem';
import Loader from '../Loader';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import ConfirmationModal from '../ConfirmationModal';

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
} from '@mantine/core';

interface OrderHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const OrderHistoryModal: React.FC<OrderHistoryModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const ordersQuery = useGetOrdersQuery();
  const { data: ordersData, isFetching, error } = ordersQuery;
  const [removeOrder, { isLoading: isRemoveLoading }] = useRemoveOrderMutation();
  const [selectedOrder, setSelectedOrder] = useState(0);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen) void ordersQuery.refetch();
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
      toast.error(t('error_removing_order', { error: String(error) }));
    } finally {
      await ordersQuery.refetch();
    }
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
      return <Text c="red">{t('error_loading_orders')}</Text>;
    }

    if (ordersData && ordersData.length > 0) {
      return (
        <ScrollArea.Autosize>
          <Stack>
            {ordersData.map((order) => {
              const totalPrice = order.items.reduce(
                (acc, item) => acc + (item.product.price * item.quantity - item.discountedAmount),
                0
              );
              const totalItems = order.items.reduce((acc, item) => acc + item.quantity, 0);
              return (
                <Card withBorder key={order.id}>
                  <Stack>
                    <Group justify="space-between">
                      <Text fw={500}>
                        {t('order_number', {
                          id: order.id,
                          date: new Date(order.date).toLocaleString(),
                        })}
                      </Text>
                      <Button
                        onClick={() => onRemoveOrder(order.id)}
                        color="red"
                        variant="outline"
                        size="xs"
                      >
                        {t('delete')}
                      </Button>
                    </Group>
                    <Stack gap="xs">
                      {order.items.map((item, itemIndex) => (
                        <CartItem key={itemIndex} item={item} />
                      ))}
                    </Stack>
                    <Divider />
                    <Group justify="space-between">
                      <Text fw={700}>
                        {totalPrice} {t('tokens', { count: totalPrice })}
                      </Text>
                      <Text size="sm" c="dimmed">
                        {totalItems} {t('items', { count: totalItems })}
                      </Text>
                    </Group>
                  </Stack>
                </Card>
              );
            })}
          </Stack>
        </ScrollArea.Autosize>
      );
    }

    return <Text>{t('no_orders')}</Text>;
  };

  return (
    <>
      <Modal opened={isOpen} onClose={onClose} title={t('order_history')} size="lg" centered>
        {renderContent()}
      </Modal>
      <ConfirmationModal
        isOpen={isConfirmationModalOpen}
        onClose={() => setIsConfirmationModalOpen(false)}
        onConfirm={() => void onConfirmRemoveOrder(selectedOrder)}
        title={t('confirmation')}
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
