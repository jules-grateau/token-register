import React, { Fragment, useEffect, useRef, useState } from 'react';
import {
  Paper,
  Group,
  Text,
  Center,
  ScrollArea,
  Stack,
  Button,
  ActionIcon,
  Divider,
  Drawer,
  UnstyledButton,
} from '@mantine/core';
import CartItem from './CartItem';
import { useCurrency } from '../../hooks/useCurrency';
import { useDispatch, useSelector } from 'react-redux';
import {
  selectCartItems,
  selectTotalPrice,
  remove,
  selectTotalItems,
  addDiscount,
  updateQuantity,
} from '../../redux/cartSlice';
import { useTranslation } from 'react-i18next';
import type { CartItemType } from 'shared-ts';
import DiscountModal, { type DiscountDetails } from '../DiscountModal';
import { IconChevronUp, IconHistory, IconTrash } from '@tabler/icons-react';
import { useLayoutMode } from '../../hooks/useLayoutMode';
import { useClearCartWithUndo } from '../../hooks/useClearCartWithUndo';
import classes from './Cart.module.css';

interface CartProps {
  onClickHistory: () => void;
  onValidateCart: () => void;
  /** Phone portrait only: the cart is a collapsed bar that opens a Drawer. */
  isDrawerOpen?: boolean;
  onDrawerOpenChange?: (open: boolean) => void;
}

const BORDER = '1px solid var(--mantine-color-default-border)';

// docs/design/components.md, "Panier". Layout per mode: docs/design/spacing-layout.md.
const Cart: React.FC<CartProps> = ({
  onClickHistory,
  onValidateCart,
  isDrawerOpen = false,
  onDrawerOpenChange,
}: CartProps) => {
  const { t } = useTranslation();
  const { format } = useCurrency();
  const mode = useLayoutMode();
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [discountModalTarget, setDiscountModalTarget] = useState<CartItemType>();
  const cartItems = useSelector(selectCartItems);
  const totalPrice = useSelector(selectTotalPrice);
  const totalItems = useSelector(selectTotalItems);
  const dispatch = useDispatch();
  const clearCartWithUndo = useClearCartWithUndo();
  const isEmpty = cartItems.length === 0;

  // Phone portrait: the total pulses when an item is added.
  const previousTotalItems = useRef(totalItems);
  const [pulseKey, setPulseKey] = useState(0);
  useEffect(() => {
    if (totalItems > previousTotalItems.current) setPulseKey((key) => key + 1);
    previousTotalItems.current = totalItems;
  }, [totalItems]);

  const openDiscountModal = (cartItem: CartItemType) => {
    setIsDiscountModalOpen(true);
    setDiscountModalTarget(cartItem);
  };

  const handleConfirmDiscountModal = (discountDetails: DiscountDetails) => {
    setIsDiscountModalOpen(false);
    dispatch(
      addDiscount({
        productId: discountModalTarget?.product.id || 0,
        discountedAmount: discountDetails.discount,
      })
    );
  };

  const handleQuantityChange = (item: CartItemType, amount: number) => {
    dispatch(updateQuantity({ productId: item.product.id, amount }));
  };

  const itemsLabel = `${totalItems} ${t('items', { count: totalItems })}`;

  const clearButton = (size: number) => (
    <ActionIcon
      variant="subtle"
      color="red"
      size={size}
      onClick={clearCartWithUndo}
      disabled={isEmpty}
      aria-label={t('clear_cart')}
    >
      <IconTrash size={24} color={isEmpty ? undefined : 'var(--mantine-color-red-6)'} />
    </ActionIcon>
  );

  const lines = isEmpty ? (
    <Center style={{ flex: 1 }} m={0} p="md">
      <Text size="md" style={{ fontStyle: 'italic' }}>
        {t('your_cart_is_empty')}
      </Text>
    </Center>
  ) : (
    <ScrollArea type="auto" style={{ flex: 1, minHeight: 0 }} m={0} p={0}>
      <Stack gap={0} px="sm">
        {cartItems.map((item, index) => (
          <Fragment key={item.product.id}>
            {index > 0 && <Divider />}
            <CartItem
              item={item}
              onRemove={() => dispatch(remove(index))}
              onDiscount={openDiscountModal}
              onQuantityChange={handleQuantityChange}
            />
          </Fragment>
        ))}
      </Stack>
    </ScrollArea>
  );

  const standardFooter = !isEmpty && (
    <Stack gap="sm" p="md" style={{ borderTop: BORDER, flex: 'none' }}>
      <Group justify="space-between">
        <Text size="md" c="dimmed">
          {t('total_items')}
        </Text>
        <Text fw={500} size="md" data-testid="cart-total-item">
          {totalItems}
        </Text>
      </Group>
      <Group justify="space-between" wrap="nowrap">
        <Text fz={24} fw={800}>
          {t('total')}
        </Text>
        <Text fz={24} fw={800} data-testid="item-total-price" style={{ whiteSpace: 'nowrap' }}>
          {format(totalPrice)}
        </Text>
      </Group>
      <Button onClick={onValidateCart} fullWidth size="lg">
        {t('checkout')}
      </Button>
    </Stack>
  );

  const discountModal = discountModalTarget && (
    <DiscountModal
      isOpen={isDiscountModalOpen}
      item={discountModalTarget}
      onClose={() => setIsDiscountModalOpen(false)}
      onConfirmDiscount={handleConfirmDiscountModal}
    />
  );

  if (mode === 'phone-portrait') {
    const openDrawer = () => onDrawerOpenChange?.(true);
    return (
      <>
        <Paper
          radius={0}
          shadow="md"
          px="md"
          w="100%"
          h="calc(var(--cart-bar-height) + env(safe-area-inset-bottom))"
          style={{ borderTop: BORDER, flex: 'none', paddingBottom: 'env(safe-area-inset-bottom)' }}
          data-testid="cart-bar"
        >
          <Group wrap="nowrap" h="100%" gap="sm">
            <UnstyledButton
              onClick={openDrawer}
              aria-label={t('view_cart')}
              style={{ flex: 1, minWidth: 0 }}
              h="100%"
            >
              {isEmpty ? (
                <Text size="md" c="dimmed">
                  {t('cart_empty_short')}
                </Text>
              ) : (
                <Stack gap={0}>
                  <Text size="md" c="dimmed">
                    {itemsLabel}
                  </Text>
                  <Text
                    key={pulseKey}
                    className={pulseKey > 0 ? classes.pulse : undefined}
                    fz={20}
                    fw={800}
                    style={{ whiteSpace: 'nowrap', transformOrigin: 'left center' }}
                    data-testid="cart-bar-total"
                  >
                    {format(totalPrice)}
                  </Text>
                </Stack>
              )}
            </UnstyledButton>
            <ActionIcon variant="subtle" size={44} onClick={openDrawer} aria-label={t('view_cart')}>
              <IconChevronUp size={24} />
            </ActionIcon>
            <Button size="lg" onClick={onValidateCart} disabled={isEmpty}>
              {t('checkout')}
            </Button>
          </Group>
        </Paper>

        <Drawer.Root
          opened={isDrawerOpen}
          onClose={() => onDrawerOpenChange?.(false)}
          position="bottom"
          size="85%"
          // On Drawer.Content, `style` would also reach the inner wrapper: target content only.
          styles={{ content: { display: 'flex', flexDirection: 'column', overflow: 'hidden' } }}
        >
          <Drawer.Overlay />
          <Drawer.Content radius="md">
            <Drawer.Header style={{ borderBottom: BORDER }} py="xs">
              <Drawer.Title fz={18} fw={700}>
                {t('cart')}
              </Drawer.Title>
              <Group gap="xs" wrap="nowrap">
                {clearButton(44)}
                <Drawer.CloseButton size={44} aria-label={t('close')} />
              </Group>
            </Drawer.Header>
            <Drawer.Body
              p={0}
              style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
            >
              {lines}
              {standardFooter}
            </Drawer.Body>
          </Drawer.Content>
        </Drawer.Root>
        {discountModal}
      </>
    );
  }

  if (mode === 'phone-landscape') {
    return (
      <Paper
        radius={0}
        p={0}
        display="flex"
        flex={1}
        style={{ borderLeft: BORDER, flexDirection: 'column', minHeight: 0 }}
      >
        {lines}
        <Group wrap="nowrap" gap="xs" p="xs" mih={60} style={{ borderTop: BORDER, flex: 'none' }}>
          {clearButton(44)}
          <Stack gap={0} style={{ flex: 'none' }}>
            <Text size="md" c="dimmed" data-testid="cart-total-item">
              {itemsLabel}
            </Text>
            <Text fz={20} fw={800} data-testid="item-total-price" style={{ whiteSpace: 'nowrap' }}>
              {format(totalPrice)}
            </Text>
          </Stack>
          <Button h={44} miw={110} style={{ flex: 1 }} onClick={onValidateCart} disabled={isEmpty}>
            {t('checkout')}
          </Button>
        </Group>
        {discountModal}
      </Paper>
    );
  }

  // Tablet and desktop: right-hand column.
  return (
    <Paper
      radius={0}
      p={0}
      display="flex"
      flex={1}
      style={{ border: BORDER, flexDirection: 'column', minHeight: 0 }}
    >
      <Group justify="flex-end" p={4} gap="xs" style={{ borderBottom: BORDER, flex: 'none' }}>
        <ActionIcon variant="subtle" size={48} onClick={onClickHistory} aria-label={t('history')}>
          <IconHistory stroke={1.5} size={28} />
        </ActionIcon>
        {clearButton(48)}
      </Group>
      {lines}
      {standardFooter}
      {discountModal}
    </Paper>
  );
};

export default Cart;
