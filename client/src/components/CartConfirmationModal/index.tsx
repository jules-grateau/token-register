import React, { useEffect, useMemo, useState } from 'react';
import CartItem from '../Cart/CartItem';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import {
  selectCartItems,
  selectTotalPrice,
  selectTotalItems,
  clearCart,
} from '../../redux/cartSlice';
import { useAddOrderMutation, useGetOrdersQuery } from '../../services/orders';
import type { OrderPaymentType } from 'shared-ts';
import { toast } from 'react-toastify';
import {
  ActionIcon,
  Box,
  Button,
  Group,
  Modal,
  ScrollArea,
  SimpleGrid,
  Stack,
  Text,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconCash,
  IconCheck,
  IconCreditCard,
  IconKeyboard,
  IconX,
} from '@tabler/icons-react';
import { useCurrency } from '../../hooks/useCurrency';
import { isPhoneMode, useLayoutMode } from '../../hooks/useLayoutMode';
import { CART_CLEARED_TOAST_ID } from '../../hooks/useClearCartWithUndo';
import {
  applyKeypadKey,
  cardPayment,
  cashPayment,
  computeChangeState,
  getPaymentUnit,
  parseKeypadInput,
  splitCashPayment,
  suggestAmounts,
  toKeypadInput,
  type KeypadKey,
} from '../../utils/payment';
import ChangeDisplay from './ChangeDisplay';
import { dismissSuccessToasts } from '../../utils/toasts';
import PaymentKeypad from './PaymentKeypad';
import classes from './CartConfirmationModal.module.css';
import figures from '../../styles/figures.module.css';

interface CartConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called after the order is saved (e.g. to collapse the phone cart Drawer). */
  onOrderPlaced?: () => void;
}

const NOWRAP = { whiteSpace: 'nowrap' } as const;

/** D-035: the API answers 400 with code PAYMENT_REQUIRED when the payment is missing. */
const isPaymentRequiredError = (error: unknown): boolean =>
  typeof error === 'object' &&
  error !== null &&
  'data' in error &&
  typeof error.data === 'object' &&
  error.data !== null &&
  'code' in error.data &&
  error.data.code === 'PAYMENT_REQUIRED';
const DIGITS = new Set(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']);

/**
 * "Encaissement" (docs/design/components.md, D-028 to D-034): payment mode, cash received and
 * change to give back. Card and exact amount save at once; a cash amount with change waits
 * for "Encaisser", so that the change stays on screen while it is counted.
 */
const CartConfirmationModal: React.FC<CartConfirmationModalProps> = ({
  isOpen,
  onClose,
  onOrderPlaced,
}) => {
  const { t } = useTranslation();
  const { currency, format } = useCurrency();
  const layout = useLayoutMode();
  const isPhone = isPhoneMode(layout);
  const isLandscape = layout === 'phone-landscape';
  const isEur = currency === 'EUR';
  const unit = getPaymentUnit(currency);

  const cartItems = useSelector(selectCartItems);
  const total = useSelector(selectTotalPrice);
  const totalItems = useSelector(selectTotalItems);

  const [addOrder, { isLoading }] = useAddOrderMutation();
  const ordersQuery = useGetOrdersQuery();
  const dispatch = useDispatch();

  // Typed text ("18,5"); a touched suggestion replaces it and the next key starts over.
  const [input, setInput] = useState('');
  const [selectedSuggestion, setSelectedSuggestion] = useState<number | null>(null);
  const [view, setView] = useState<'amounts' | 'keypad'>('amounts');

  useEffect(() => {
    if (isOpen) {
      // DS-2: the toast of the previous sale must not cover this one; errors stay.
      dismissSuccessToasts();
      setInput('');
      setSelectedSuggestion(null);
      setView('amounts');
    }
  }, [isOpen]);

  const received = parseKeypadInput(input, unit);
  const changeState = computeChangeState(total, received, currency);
  const suggestions = useMemo(() => (total > 0 ? suggestAmounts(total, unit) : []), [total, unit]);
  const isEmpty = cartItems.length === 0;
  const keypadAlwaysVisible = !isPhone;
  const showKeypadView = keypadAlwaysVisible || view === 'keypad';

  const sizes = {
    button: isLandscape ? 48 : 56,
    key: isLandscape ? 44 : isPhone ? 56 : 64,
  };

  const paymentLabel = (payment: OrderPaymentType) => {
    if (payment.cashAmount !== null && payment.cardAmount !== null) {
      return t('payment_cash_and_card');
    }
    return t(payment.cashAmount !== null ? 'payment_cash' : 'payment_card');
  };

  /** Token instances record no payment (D-033): `payment` is null there. */
  const submit = async (payment: OrderPaymentType | null) => {
    if (isLoading || isEmpty) return;
    try {
      const id = await addOrder({ items: cartItems, payment }).unwrap();
      dispatch(clearCart());
      void ordersQuery.refetch();
      // D-025: once an order is placed, emptying the cart can no longer be undone.
      toast.dismiss(CART_CLEARED_TOAST_ID);
      toast.success(
        payment
          ? t('order_placed_with_payment', { id, payment: paymentLabel(payment) })
          : t('order_placed', { id })
      );
      onClose();
      onOrderPlaced?.();
    } catch (error) {
      // D-035: an EUR instance refuses an order without payment (outdated page).
      const message = isPaymentRequiredError(error)
        ? t('payment_required_reload')
        : t('error_adding_order', { error: String(error) });
      toast.error(message, { autoClose: 5000 });
    }
  };

  const payByCard = () => void submit(cardPayment(total));
  const payExact = () => void submit(isEur ? cashPayment(total) : null);
  const payCash = () => {
    if (received === null) return;
    void submit(isEur ? splitCashPayment(total, received) : null);
  };

  const mainAction = (() => {
    switch (changeState.kind) {
      case 'change':
      case 'no-change':
        return { label: t('payment_collect'), icon: <IconCheck size={22} />, enabled: true };
      case 'remaining':
        return {
          label: t('payment_rest_by_card', { amount: format(changeState.remaining) }),
          icon: <IconCreditCard size={22} />,
          enabled: true,
        };
      default:
        return { label: t('payment_collect'), icon: <IconCheck size={22} />, enabled: false };
    }
  })();

  const handleKey = (key: KeypadKey) => {
    const base = selectedSuggestion !== null ? '' : input;
    setSelectedSuggestion(null);
    setInput(applyKeypadKey(base, key, isEur));
  };

  const clearInput = () => {
    setSelectedSuggestion(null);
    setInput('');
  };

  const pickSuggestion = (amount: number) => {
    setSelectedSuggestion(amount);
    setInput(toKeypadInput(amount, unit));
  };

  const handleClose = () => {
    if (isLoading) return;
    onClose();
  };

  // Physical keyboard (docs/design/components.md, "Clavier physique"), only when total > 0.
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (total <= 0 || isEmpty || isLoading) return;
    const { key } = event;
    let keypadKey: KeypadKey | null = null;
    if (DIGITS.has(key)) keypadKey = key as KeypadKey;
    else if ((key === ',' || key === '.' || key === 'Decimal') && isEur) keypadKey = ',';
    else if (key === 'Backspace') keypadKey = 'backspace';

    if (keypadKey) {
      event.preventDefault();
      handleKey(keypadKey);
      if (isPhone && DIGITS.has(key)) setView('keypad');
      return;
    }
    if (key === 'Delete') {
      event.preventDefault();
      clearInput();
      return;
    }
    if (key === 'Enter') {
      // A focused button keeps its native behaviour; Enter never triggers Card or Exact.
      if ((event.target as HTMLElement).closest('button')) return;
      event.preventDefault();
      if (mainAction.enabled) payCash();
    }
  };

  // --- Building blocks -------------------------------------------------------------------

  const recapLines = (
    <Stack gap="xs">
      {cartItems.map((item, index) => (
        <CartItem key={index} item={item} showQuantity />
      ))}
    </Stack>
  );

  const totalLine = (
    <Group justify="space-between" wrap="nowrap">
      <Text fz={16}>{`${t('total')} · ${totalItems} ${t('items', { count: totalItems })}`}</Text>
      <Text fz={24} fw={800} style={NOWRAP} className={figures.big}>
        {format(total)}
      </Text>
    </Group>
  );

  const collapsedRecap = (
    <Group justify="space-between" wrap="nowrap" mih={44}>
      <Text fz={16}>{`${t('total')} · ${totalItems} ${t('items', { count: totalItems })}`}</Text>
      <Text fz={20} fw={800} style={NOWRAP}>
        {format(total)}
      </Text>
    </Group>
  );

  const changeDisplay = (
    <ChangeDisplay
      state={changeState}
      currency={currency}
      format={format}
      compact={isLandscape}
      minHeight={layout === 'phone-portrait' ? 112 : 96}
      autoFocus={!showKeypadView || total <= 0}
    />
  );

  const exactButton = (fullWidth: boolean) => (
    <Button
      variant="default"
      h={sizes.button}
      fullWidth={fullWidth}
      onClick={payExact}
      loading={isLoading}
      disabled={isLoading}
      aria-label={t('payment_exact_aria', { amount: format(total) })}
    >
      {isLandscape || !isEur ? (
        <Text fz={18} fw={700} style={NOWRAP}>
          {`${t('payment_exact')} ${format(total)}`}
        </Text>
      ) : (
        <Stack gap={0} align="center">
          <Text fz={16} fw={600}>
            {t('payment_exact')}
          </Text>
          <Text fz={18} fw={700} style={NOWRAP}>
            {format(total)}
          </Text>
        </Stack>
      )}
    </Button>
  );

  const modeRow = isEur ? (
    <SimpleGrid cols={2} spacing="xs">
      <Button
        variant="default"
        h={sizes.button}
        fz={18}
        fw={700}
        // DS-1: narrow padding and wrapping label, so that "Tout en carte" is never cut.
        px="xs"
        styles={{ label: { whiteSpace: 'normal', textAlign: 'center' } }}
        leftSection={<IconCreditCard size={received !== null ? 20 : 24} />}
        onClick={payByCard}
        loading={isLoading}
        disabled={isLoading}
        aria-label={
          received !== null ? t('payment_all_card', { amount: format(total) }) : undefined
        }
      >
        {received !== null ? (
          // Two lines, like "Appoint": the one-line label is cut in a half-width button.
          <Stack gap={0} align="center">
            <Text fz={16} fw={600} lh={1.2}>
              {t('payment_all_card_label')}
            </Text>
            <Text fz={18} fw={700} lh={1.2} style={NOWRAP}>
              {format(total)}
            </Text>
          </Stack>
        ) : (
          t('payment_card')
        )}
      </Button>
      {exactButton(false)}
    </SimpleGrid>
  ) : (
    exactButton(true)
  );

  const receivedLabel = (
    <Group gap="xs" wrap="nowrap">
      <IconCash size={20} color="var(--mantine-color-dimmed)" aria-hidden />
      <Text fz={16} c="dimmed">
        {t(isEur ? 'payment_cash_received' : 'payment_tokens_received')}
      </Text>
    </Group>
  );

  const suggestionGrid = (
    <SimpleGrid cols={4} spacing="xs">
      {suggestions.map((amount) => {
        const selected = selectedSuggestion === amount;
        return (
          <Button
            key={amount}
            variant={selected ? 'filled' : 'default'}
            h={sizes.button}
            fz={20}
            fw={700}
            px={0}
            style={NOWRAP}
            leftSection={selected ? <IconCheck size={18} /> : undefined}
            aria-pressed={selected}
            aria-label={t('payment_received_aria', { amount: format(amount) })}
            onClick={() => pickSuggestion(amount)}
            disabled={isLoading}
          >
            {isEur ? `${amount / unit}\u00a0€` : String(amount)}
          </Button>
        );
      })}
    </SimpleGrid>
  );

  const otherAmountButton = (
    <Button
      variant="default"
      fullWidth
      h={48}
      fz={16}
      fw={700}
      leftSection={<IconKeyboard size={20} />}
      onClick={() => setView('keypad')}
      disabled={isLoading}
    >
      {t('payment_other_amount')}
    </Button>
  );

  const typedText = `${input || '0'}${isEur ? '\u00a0€' : ` ${t('tokens', { count: received ?? 0 })}`}`;
  const amountDisplay = (
    <Group justify="space-between" wrap="nowrap" mih={44} gap="xs">
      {isPhone ? (
        <Button
          variant="subtle"
          h={44}
          className={classes.inkControl}
          leftSection={<IconArrowLeft size={20} />}
          onClick={() => setView('amounts')}
          disabled={isLoading}
        >
          {t('payment_back_to_amounts')}
        </Button>
      ) : (
        <Text fz={16} c="dimmed">
          {t('payment_received')}
        </Text>
      )}
      <Group gap="xs" wrap="nowrap">
        <Text
          fz={32}
          fw={800}
          ta="right"
          c={input === '' ? 'dimmed' : undefined}
          style={NOWRAP}
          className={figures.big}
          tabIndex={-1}
          data-autofocus={showKeypadView && total > 0 ? true : undefined}
          data-testid="typed-amount"
        >
          {typedText}
        </Text>
        <ActionIcon
          variant="subtle"
          size={44}
          className={classes.inkControl}
          onClick={clearInput}
          aria-label={t('payment_clear_amount')}
          disabled={isLoading}
        >
          <IconX size={20} />
        </ActionIcon>
      </Group>
    </Group>
  );

  const keypad = (
    <PaymentKeypad
      allowDecimal={isEur}
      onKey={handleKey}
      disabled={isLoading}
      cols={isLandscape ? 4 : 3}
      keyHeight={sizes.key}
    />
  );

  const mainButton = (
    <Button
      fullWidth
      h={sizes.button}
      fz={18}
      fw={800}
      radius={18}
      className={classes.mainButton}
      leftSection={mainAction.icon}
      onClick={payCash}
      disabled={!mainAction.enabled || isLoading}
      loading={isLoading}
    >
      {mainAction.label}
    </Button>
  );

  // Total <= 0 (D-032): no suggestion, no keypad; the mode is still asked in euros.
  const nonPositiveActions = isEur ? (
    <SimpleGrid cols={2} spacing="xs">
      <Button
        variant="default"
        h={sizes.button}
        fz={18}
        fw={700}
        leftSection={<IconCash size={24} />}
        onClick={() => void submit(cashPayment(total))}
        loading={isLoading}
        disabled={isLoading}
      >
        {t('payment_cash')}
      </Button>
      <Button
        variant="default"
        h={sizes.button}
        fz={18}
        fw={700}
        leftSection={<IconCreditCard size={24} />}
        onClick={payByCard}
        loading={isLoading}
        disabled={isLoading}
      >
        {t('payment_card')}
      </Button>
    </SimpleGrid>
  ) : (
    <Button
      fullWidth
      h={sizes.button}
      fz={18}
      fw={800}
      radius={18}
      className={classes.mainButton}
      leftSection={<IconCheck size={22} />}
      onClick={() => void submit(null)}
      loading={isLoading}
      disabled={isLoading}
    >
      {t('payment_save')}
    </Button>
  );

  // --- Layouts ---------------------------------------------------------------------------

  const renderBody = () => {
    if (isEmpty) return <Text>{t('your_cart_is_empty')}</Text>;

    if (total <= 0) {
      return (
        <Stack gap="sm">
          <ScrollArea.Autosize mah={isPhone ? '50vh' : 300}>{recapLines}</ScrollArea.Autosize>
          {totalLine}
          {changeDisplay}
          {nonPositiveActions}
        </Stack>
      );
    }

    if (layout === 'phone-portrait') {
      return (
        <Stack gap="sm" style={{ flex: 1, minHeight: 0 }}>
          {view === 'keypad' ? (
            <>
              {collapsedRecap}
              {amountDisplay}
              {keypad}
            </>
          ) : (
            <>
              <ScrollArea style={{ flex: 1 }} mih={88} type="auto" offsetScrollbars>
                {recapLines}
              </ScrollArea>
              {totalLine}
              {modeRow}
              {receivedLabel}
              {suggestionGrid}
              {otherAmountButton}
            </>
          )}
          {changeDisplay}
          <Box mt="auto" pb="env(safe-area-inset-bottom)">
            {mainButton}
          </Box>
        </Stack>
      );
    }

    const leftColumn = (
      <Stack gap="sm" style={{ flex: isLandscape ? '0 0 40%' : 1, minWidth: 0 }}>
        <ScrollArea.Autosize mah={isLandscape ? '40vh' : 300} type="auto">
          {recapLines}
        </ScrollArea.Autosize>
        {totalLine}
        {changeDisplay}
      </Stack>
    );

    const rightColumn = (
      <Stack gap="sm" style={{ flex: 1, minWidth: 0 }}>
        {isLandscape && view === 'keypad' ? (
          <>
            {amountDisplay}
            {keypad}
          </>
        ) : (
          <>
            {modeRow}
            {!isLandscape && receivedLabel}
            {suggestionGrid}
            {isLandscape ? (
              otherAmountButton
            ) : (
              <>
                {amountDisplay}
                {keypad}
              </>
            )}
          </>
        )}
        <Box mt="auto">{mainButton}</Box>
      </Stack>
    );

    return (
      <Group align="stretch" wrap="nowrap" gap="md">
        {leftColumn}
        {rightColumn}
      </Group>
    );
  };

  return (
    <Modal
      opened={isOpen}
      onClose={handleClose}
      title={t('cart_confirmation')}
      fullScreen={isPhone}
      size={720}
      centered
      closeOnEscape={!isLoading}
      closeButtonProps={{ size: 44, 'aria-label': t('close'), disabled: isLoading }}
      styles={{
        title: { fontSize: 18, fontWeight: 700 },
        header: { minHeight: isLandscape ? 44 : 56, paddingBlock: isLandscape ? 0 : undefined },
        ...(layout === 'phone-portrait'
          ? {
              content: { display: 'flex', flexDirection: 'column' },
              body: { flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 },
            }
          : {}),
      }}
    >
      <Box
        onKeyDown={handleKeyDown}
        style={
          layout === 'phone-portrait'
            ? { flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }
            : undefined
        }
      >
        {renderBody()}
      </Box>
    </Modal>
  );
};

export default CartConfirmationModal;
