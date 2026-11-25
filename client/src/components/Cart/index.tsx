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
  type ButtonProps,
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
import { IconArrowRight, IconChevronUp, IconHistory, IconTrash } from '@tabler/icons-react';
import { useLayoutMode } from '../../hooks/useLayoutMode';
import { useClearCartWithUndo } from '../../hooks/useClearCartWithUndo';
import { useCurrentCashDay } from '../../hooks/useCashDay';
import NoCashDayBanner from '../CashDay/NoCashDayBanner';
import classes from './Cart.module.css';

interface CartProps {
  onClickHistory: () => void;
  onValidateCart: () => void;
  /** Phone portrait only: the cart is a collapsed bar that opens a Drawer. */
  isDrawerOpen?: boolean;
  onDrawerOpenChange?: (open: boolean) => void;
}

const BORDER = '1px solid var(--color-border)';

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
  // D-061 (answer 19 a): no sale without an open cash day; the banner starts it.
  const { isNone: noCashDay } = useCurrentCashDay();

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

  // On the ink bar (phone landscape), the danger icon is not allowed: --color-on-bar.
  const clearButton = (size: number, onBar = false) => (
    <ActionIcon
      variant="subtle"
      color={onBar ? 'gray' : 'red'}
      size={size}
      radius={14}
      onClick={clearCartWithUndo}
      disabled={isEmpty}
      aria-label={t('clear_cart')}
      className={onBar ? classes.onBar : undefined}
    >
      <IconTrash
        size={24}
        color={isEmpty ? undefined : onBar ? 'var(--color-on-bar)' : 'var(--color-danger)'}
      />
    </ActionIcon>
  );

  // "Valider": ink (cream on the ink bar), 18 / 800, arrow on the right of the text.
  const checkoutButton = (props: ButtonProps & { style?: React.CSSProperties }) => (
    <Button
      onClick={onValidateCart}
      disabled={isEmpty || noCashDay}
      radius={18}
      fz={18}
      fw={800}
      rightSection={<IconArrowRight size={22} aria-hidden />}
      className={classes.checkout}
      {...props}
    >
      {t('checkout')}
    </Button>
  );

  const lines = isEmpty ? (
    <Center style={{ flex: 1 }} m={0} p="md">
      <Text size="md" c="var(--color-text-2)">
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
        <Text size="md" c="var(--color-text-2)">
          {t('total_items')}
        </Text>
        <Text fw={600} size="md" data-testid="cart-total-item">
          {totalItems}
        </Text>
      </Group>
      <Group justify="space-between" wrap="nowrap">
        <Text fz={24} fw={800}>
          {t('total')}
        </Text>
        <Text fz={24} fw={800} data-testid="item-total-price" className={classes.amount}>
          {format(totalPrice)}
        </Text>
      </Group>
      {checkoutButton({ fullWidth: true, h: 56 })}
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
        {noCashDay && <NoCashDayBanner />}
        {/* Ink bar in the page flow, never fixed over the grid (docs/design, "Barre repliée"). */}
        <Paper
          radius={0}
          px="md"
          w="100%"
          h="calc(var(--cart-bar-height) + env(safe-area-inset-bottom))"
          className={classes.bar}
          style={{ flex: 'none', paddingBottom: 'env(safe-area-inset-bottom)' }}
          data-testid="cart-bar"
        >
          <Group wrap="nowrap" h="100%" gap="sm">
            <UnstyledButton
              onClick={openDrawer}
              aria-label={t('view_cart')}
              className={classes.onBar}
              style={{ flex: 1, minWidth: 0 }}
              h="100%"
            >
              {isEmpty ? (
                <Text size="md" c="var(--color-on-bar-2)">
                  {t('cart_empty_short')}
                </Text>
              ) : (
                <Stack gap={0}>
                  <Text size="md" c="var(--color-on-bar-2)">
                    {itemsLabel}
                  </Text>
                  <Text
                    key={pulseKey}
                    className={pulseKey > 0 ? `${classes.amount} ${classes.pulse}` : classes.amount}
                    fz={26}
                    fw={800}
                    lh={1.2}
                    c="var(--color-on-bar)"
                    style={{ transformOrigin: 'left center' }}
                    data-testid="cart-bar-total"
                  >
                    {format(totalPrice)}
                  </Text>
                </Stack>
              )}
            </UnstyledButton>
            <ActionIcon
              variant="subtle"
              color="gray"
              size={44}
              radius={14}
              onClick={openDrawer}
              aria-label={t('view_cart')}
              className={classes.onBar}
            >
              <IconChevronUp size={24} color="var(--color-on-bar)" />
            </ActionIcon>
            {checkoutButton({ h: 56, style: { flex: 'none' } })}
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
          <Drawer.Content radius="lg">
            <div className={classes.handle} aria-hidden />
            <Drawer.Header style={{ borderBottom: BORDER }} pt={4} pb="xs">
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
              {noCashDay && <NoCashDayBanner />}
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
        {noCashDay && <NoCashDayBanner compact />}
        {lines}
        {/* Compact footer: one 60 px ink row, like the phone portrait bar. */}
        <Group
          wrap="nowrap"
          gap="xs"
          p="xs"
          mih={60}
          className={classes.bar}
          style={{ flex: 'none' }}
        >
          {clearButton(44, true)}
          <Stack gap={0} style={{ flex: 'none' }}>
            <Text size="md" c="var(--color-on-bar-2)" data-testid="cart-total-item">
              {itemsLabel}
            </Text>
            <Text
              fz={20}
              fw={800}
              c="var(--color-on-bar)"
              data-testid="item-total-price"
              className={classes.amount}
            >
              {format(totalPrice)}
            </Text>
          </Stack>
          {checkoutButton({ h: 44, miw: 110, style: { flex: 1 } })}
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
      style={{ borderLeft: BORDER, flexDirection: 'column', minHeight: 0 }}
    >
      <Group justify="flex-end" p={4} gap="xs" style={{ borderBottom: BORDER, flex: 'none' }}>
        <ActionIcon
          variant="subtle"
          color="gray"
          size={48}
          radius={14}
          onClick={onClickHistory}
          aria-label={t('history')}
        >
          {/* docs/design/icons.md: history icon in --color-text (Mantine gray looked disabled). */}
          <IconHistory stroke={1.5} size={28} color="var(--color-text)" />
        </ActionIcon>
        {clearButton(48)}
      </Group>
      {noCashDay && <NoCashDayBanner />}
      {lines}
      {standardFooter}
      {discountModal}
    </Paper>
  );
};

export default Cart;
