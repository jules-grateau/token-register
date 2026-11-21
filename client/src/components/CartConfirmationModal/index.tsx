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
  IconArrowBackUp,
  IconArrowLeft,
  IconCash,
  IconCheck,
  IconCreditCard,
  IconKeyboard,
  IconPlus,
  IconX,
} from '@tabler/icons-react';
import { useCurrency } from '../../hooks/useCurrency';
import { isPhoneMode, useLayoutMode } from '../../hooks/useLayoutMode';
import { CART_CLEARED_TOAST_ID } from '../../hooks/useClearCartWithUndo';
import {
  addPart,
  applyCardKey,
  applyKeypadKey,
  cashSuggestions,
  completePayment,
  computeChangeState,
  getPaymentUnit,
  hasParts,
  NO_PARTS,
  parseKeypadInput,
  partOutcome,
  remainingDue,
  removePart,
  singleModePayment,
  toKeypadInput,
  type KeypadKey,
  type PaymentMode,
  type PaymentParts,
} from '../../utils/payment';
import ChangeDisplay from './ChangeDisplay';
import PaymentPartsList from './PaymentPartsList';
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
 * "Encaissement" (docs/design/components.md, D-053, D-034). In euros, the mode comes first
 * (Espèces | Carte), then its amount: card prefilled with the amount due and never above it,
 * cash with suggestions and the keypad. A part below the amount due is added ("Ajouter"), one
 * per mode; the part that covers it saves the sale ("Encaisser"). Total <= 0: the mode, then
 * "Rembourser" (or "Encaisser" at 0). Token instances: the recap and "Encaisser" only.
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

  const [mode, setMode] = useState<PaymentMode | null>(null);
  const [parts, setParts] = useState<PaymentParts>(NO_PARTS);
  // Typed text ("18,5"). A prefilled amount or a touched suggestion is replaced by the next key.
  const [input, setInput] = useState('');
  const [replaceNext, setReplaceNext] = useState(false);
  const [view, setView] = useState<'amounts' | 'keypad'>('amounts');

  useEffect(() => {
    if (isOpen) {
      // DS-2: the toast of the previous sale must not cover this one; errors stay.
      dismissSuccessToasts();
      setMode(null);
      setParts(NO_PARTS);
      setInput('');
      setReplaceNext(false);
      setView('amounts');
    }
  }, [isOpen]);

  const isEmpty = cartItems.length === 0;
  const isPositive = total > 0;
  const due = remainingDue(total, parts);
  const amount = parseKeypadInput(input, unit);
  const changeState = computeChangeState(total, parts, mode, amount);
  const outcome = isPositive && mode ? partOutcome(mode, amount, due, parts) : 'none';
  const suggestions = useMemo(
    () => (isEur && mode === 'cash' && due > 0 ? cashSuggestions(due, unit) : []),
    [isEur, mode, due, unit]
  );
  const selectedSuggestion = replaceNext && mode === 'cash' ? amount : null;
  // Phone: the keypad takes the screen (always for the card, "Autre montant" for cash).
  const keypadOnly = isPhone && (mode === 'card' || (mode === 'cash' && view === 'keypad'));
  // Phone portrait keypad view: the "Espèces | Carte" row stays visible (DS-1 of PR #47), so
  // the keys, the mode row and the change block are lower to fit in 390 × 664.
  const portraitKeypad = layout === 'phone-portrait' && keypadOnly;

  const sizes = {
    button: isLandscape ? 48 : 56,
    mode: isLandscape || portraitKeypad ? 48 : 56,
    key: isLandscape || portraitKeypad ? 44 : 64,
  };

  const paymentLabel = (payment: OrderPaymentType) => {
    if (payment.cashAmount !== null && payment.cardAmount !== null) {
      return t('payment_cash_and_card');
    }
    return t(payment.cashAmount !== null ? 'payment_cash' : 'payment_card');
  };

  /** Token instances record no payment: `payment` is null there. */
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

  const setAmount = (text: string, replace: boolean) => {
    setInput(text);
    setReplaceNext(replace);
  };

  /** Card: always prefilled with the amount due. Cash: prefilled when it is the 2nd part. */
  const chooseMode = (next: PaymentMode) => {
    if (next === mode || parts[next] !== null) return;
    setMode(next);
    setView('amounts');
    if (isPositive && (next === 'card' || hasParts(parts))) {
      setAmount(toKeypadInput(due, unit), true);
    } else {
      setAmount('', false);
    }
  };

  const backToModes = () => {
    setMode(null);
    setAmount('', false);
    setView('amounts');
  };

  const handleRemovePart = (removed: PaymentMode) => setParts(removePart(parts, removed));

  const mainAction = (() => {
    const collect = { label: t('payment_collect'), icon: <IconCheck size={22} /> };
    if (!isPositive) {
      const action =
        total < 0 ? { label: t('payment_refund'), icon: <IconArrowBackUp size={22} /> } : collect;
      if (!isEur) return { ...action, enabled: true, run: () => void submit(null) };
      return {
        ...action,
        enabled: mode !== null,
        run: () => mode && void submit(singleModePayment(mode, total)),
      };
    }
    if (!isEur) return { ...collect, enabled: true, run: () => void submit(null) };
    if (outcome === 'add' && mode && amount !== null) {
      return {
        label: t('payment_add_part'),
        icon: <IconPlus size={22} />,
        enabled: true,
        run: () => {
          setParts(addPart(parts, mode, amount));
          backToModes();
        },
      };
    }
    return {
      ...collect,
      enabled: outcome === 'complete',
      run: () => mode && amount !== null && void submit(completePayment(parts, mode, amount, due)),
    };
  })();

  const handleKey = (key: KeypadKey) => {
    if (!mode) return;
    const base = replaceNext ? '' : input;
    const next =
      mode === 'card' ? applyCardKey(base, key, due, unit) : applyKeypadKey(base, key, true);
    // A card key above the amount due has no effect: the prefilled amount stays (D-053).
    if (mode === 'card' && next === base && key !== 'backspace') return;
    setAmount(next, false);
  };

  const clearInput = () => setAmount('', false);

  const pickSuggestion = (suggestion: number) => setAmount(toKeypadInput(suggestion, unit), true);

  const handleClose = () => {
    if (isLoading) return;
    onClose();
  };

  // Physical keyboard (docs/design/components.md, "Clavier physique"), once a mode is chosen.
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!isEur || !isPositive || isEmpty || isLoading || !mode) return;
    const { key } = event;
    let keypadKey: KeypadKey | null = null;
    if (DIGITS.has(key)) keypadKey = key as KeypadKey;
    else if (key === ',' || key === '.' || key === 'Decimal') keypadKey = ',';
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
      // A focused button keeps its native behaviour.
      if ((event.target as HTMLElement).closest('button')) return;
      event.preventDefault();
      if (mainAction.enabled) mainAction.run();
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

  const partsList = (
    <PaymentPartsList
      parts={parts}
      format={format}
      onRemove={handleRemovePart}
      disabled={isLoading}
    />
  );

  const changeDisplay = (
    <ChangeDisplay
      state={changeState}
      format={format}
      compact={isLandscape}
      minHeight={layout === 'phone-portrait' && !portraitKeypad ? 112 : 96}
      autoFocus={mode === null || !isPositive}
    />
  );

  const modeButton = (buttonMode: PaymentMode) => {
    const selected = mode === buttonMode;
    const Icon = buttonMode === 'cash' ? IconCash : IconCreditCard;
    // One part per mode (D-053): a mode that has its part is done; the title says why (DS-3).
    const hasPart = isPositive && parts[buttonMode] !== null;
    const hint = hasPart ? t('payment_mode_has_part') : undefined;
    return (
      <Box title={hint} style={{ display: 'grid' }}>
        <Button
          variant={selected ? 'filled' : 'default'}
          h={sizes.mode}
          fz={18}
          fw={700}
          leftSection={<Icon size={24} />}
          aria-pressed={selected}
          aria-description={hint}
          onClick={() => chooseMode(buttonMode)}
          disabled={isLoading || hasPart}
        >
          {t(buttonMode === 'cash' ? 'payment_cash' : 'payment_card')}
        </Button>
      </Box>
    );
  };

  const modeRow = (
    <SimpleGrid cols={2} spacing="xs">
      {modeButton('cash')}
      {modeButton('card')}
    </SimpleGrid>
  );

  const receivedLabel = (
    <Group gap="xs" wrap="nowrap">
      <IconCash size={20} color="var(--mantine-color-dimmed)" aria-hidden />
      <Text fz={16} c="dimmed">
        {t('payment_cash_received')}
      </Text>
    </Group>
  );

  // Whole euros without cents ("20 €"); the exact amount due keeps its cents ("7,50 €").
  const suggestionText = (suggestion: number) =>
    suggestion % unit === 0 ? `${suggestion / unit}\u00a0€` : format(suggestion);

  const suggestionGrid = (
    <SimpleGrid cols={4} spacing="xs">
      {suggestions.map((suggestion) => {
        const selected = selectedSuggestion === suggestion;
        const text = suggestionText(suggestion);
        return (
          <Button
            key={suggestion}
            variant={selected ? 'filled' : 'default'}
            h={sizes.button}
            fz={text.length > 6 ? 16 : 20}
            fw={700}
            px={0}
            style={NOWRAP}
            leftSection={selected && text.length <= 6 ? <IconCheck size={18} /> : undefined}
            aria-pressed={selected}
            aria-label={t('payment_received_aria', { amount: format(suggestion) })}
            onClick={() => pickSuggestion(suggestion)}
            disabled={isLoading}
          >
            {text}
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

  const backButton =
    mode === 'card' ? (
      <Button
        variant="default"
        h={44}
        fz={16}
        fw={700}
        leftSection={<IconArrowLeft size={20} />}
        onClick={backToModes}
        disabled={isLoading}
      >
        {t('payment_back_to_modes')}
      </Button>
    ) : (
      <Button
        variant="default"
        h={44}
        fz={16}
        fw={700}
        leftSection={<IconArrowLeft size={20} />}
        onClick={() => setView('amounts')}
        disabled={isLoading}
      >
        {t('payment_back_to_amounts')}
      </Button>
    );

  const amountDisplay = (
    <Group justify="space-between" wrap="nowrap" mih={44} gap="xs">
      {isPhone && !(portraitKeypad && mode === 'card') ? (
        backButton
      ) : (
        <Text fz={16} c="dimmed">
          {t(mode === 'card' ? 'payment_card_amount' : 'payment_received')}
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
          data-autofocus={!isPhone && mode !== null ? true : undefined}
          data-testid="typed-amount"
        >
          {`${input || '0'}\u00a0€`}
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
      allowDecimal
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
      onClick={mainAction.run}
      disabled={!mainAction.enabled || isLoading}
      loading={isLoading}
    >
      {mainAction.label}
    </Button>
  );

  /** What follows the mode row for the chosen mode (tablet / desktop, or phone amounts view). */
  const modeContent = (withKeypad: boolean) => {
    if (mode === 'cash') {
      return (
        <>
          {!isLandscape && receivedLabel}
          {suggestionGrid}
          {withKeypad ? (
            <>
              {amountDisplay}
              {keypad}
            </>
          ) : (
            otherAmountButton
          )}
        </>
      );
    }
    if (mode === 'card' && withKeypad) {
      return (
        <>
          {amountDisplay}
          {keypad}
        </>
      );
    }
    return null;
  };

  // --- Layouts ---------------------------------------------------------------------------

  const footer = (
    <Box mt="auto" pb={layout === 'phone-portrait' ? 'env(safe-area-inset-bottom)' : undefined}>
      {mainButton}
    </Box>
  );

  const renderBody = () => {
    if (isEmpty) return <Text>{t('your_cart_is_empty')}</Text>;

    // Token instances (D-053): the recap and the main button, nothing else.
    // Total <= 0 in euros: the mode, then "Rembourser" ("Encaisser" at 0).
    if (!isEur || !isPositive) {
      return (
        <Stack gap="sm" style={layout === 'phone-portrait' ? { flex: 1, minHeight: 0 } : undefined}>
          <ScrollArea.Autosize mah={isPhone ? '50vh' : 300} type="auto">
            {recapLines}
          </ScrollArea.Autosize>
          {totalLine}
          {isEur && (
            <>
              {changeDisplay}
              {modeRow}
            </>
          )}
          {footer}
        </Stack>
      );
    }

    if (layout === 'phone-portrait') {
      return (
        <Stack gap={portraitKeypad ? 'xs' : 'sm'} style={{ flex: 1, minHeight: 0 }}>
          {keypadOnly ? (
            <>
              {!hasParts(parts) && collapsedRecap}
              {partsList}
              {modeRow}
              {amountDisplay}
              {keypad}
            </>
          ) : (
            <>
              <ScrollArea style={{ flex: 1 }} mih={88} type="auto" offsetScrollbars>
                {recapLines}
              </ScrollArea>
              {totalLine}
              {partsList}
              {modeRow}
              {modeContent(false)}
            </>
          )}
          {changeDisplay}
          {footer}
        </Stack>
      );
    }

    const leftColumn = (
      <Stack gap="sm" style={{ flex: isLandscape ? '0 0 40%' : 1, minWidth: 0 }}>
        <ScrollArea.Autosize mah={isLandscape ? '40vh' : 300} type="auto">
          {recapLines}
        </ScrollArea.Autosize>
        {totalLine}
        {partsList}
        {changeDisplay}
      </Stack>
    );

    const rightColumn = (
      <Stack gap="sm" style={{ flex: 1, minWidth: 0 }}>
        {keypadOnly ? (
          <>
            {amountDisplay}
            {keypad}
          </>
        ) : (
          <>
            {modeRow}
            {modeContent(!isLandscape)}
          </>
        )}
        {footer}
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
