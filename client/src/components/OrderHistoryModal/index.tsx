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
  Pagination,
} from '@mantine/core';

interface OrderHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const OrderHistoryModal: React.FC<OrderHistoryModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;
  const ordersQuery = useGetOrdersQuery({ page: currentPage, pageSize });
  const { data: ordersData, isFetching, error } = ordersQuery;
  const [removeOrder, { isLoading: isRemoveLoading }] = useRemoveOrderMutation();
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
                        <CartItem
                          key={itemIndex}
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
        {ordersData && ordersData.pagination && ordersData.pagination.totalPages > 1 && (
          <Stack mt="md" gap="sm">
            <Pagination
              value={currentPage}
              onChange={setCurrentPage}
              total={ordersData.pagination.totalPages}
              siblings={1}
              boundaries={1}
            />
            <Text size="sm" c="dimmed" ta="center">
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
