import { useState } from 'react';
import { Badge, Box, Button, Flex, Menu, ActionIcon, Group, Stack, Text } from '@mantine/core';
import {
  IconCalendarEvent,
  IconCheck,
  IconHistory,
  IconInfoCircle,
  IconLock,
  IconLogout,
  IconPencil,
  IconSettings,
  IconUser,
} from '@tabler/icons-react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import Catalog from '../Catalog';
import Cart from '../Cart';
import OrderHistoryModal from '../OrderHistoryModal';
import AboutModal from '../AboutModal';
import CartConfirmationModal from '../CartConfirmationModal';
import { toggleEditMode, exitEditMode, selectIsEditMode } from '../../redux/editModeSlice';
import { useCurrency } from '../../hooks/useCurrency';
import { isPhoneMode, useLayoutMode } from '../../hooks/useLayoutMode';
import ColorSchemeControl from '../ColorSchemeControl';
import { APP_NAME } from '../../config/version';
import { getClientName } from '../../config/client';
import BrandLogo from '../BrandLogo';
import CashDayModal from '../CashDay';
import CashDayIndicator from '../CashDay/CashDayIndicator';
import { useAuth } from '../../hooks/useAuth';
import classes from './Register.module.css';

// Layout per mode: docs/design/spacing-layout.md. Header: docs/design/components.md.
export function Register(): React.ReactElement {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const isEditMode = useSelector(selectIsEditMode);
  const { currency } = useCurrency();
  const mode = useLayoutMode();
  const isPhone = isPhoneMode(mode);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isCartConfirmationModalOpen, setIsCartConfrimationModalOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isCashDayOpen, setIsCashDayOpen] = useState(false);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const { user, logOut } = useAuth();

  const cart = (
    <Cart
      onClickHistory={() => setIsOrderModalOpen(true)}
      onValidateCart={() => setIsCartConfrimationModalOpen(true)}
      isDrawerOpen={isCartDrawerOpen}
      onDrawerOpenChange={setIsCartDrawerOpen}
    />
  );
  const catalog = <Catalog />;

  const renderMain = () => {
    if (mode === 'phone-portrait') {
      return (
        <>
          <Box display="flex" style={{ flex: 1, minHeight: 0 }}>
            {catalog}
          </Box>
          {!isEditMode && cart}
        </>
      );
    }
    if (mode === 'phone-landscape') {
      return (
        <Flex style={{ flex: 1, minHeight: 0 }}>
          <Box display="flex" style={{ flex: 1, minWidth: 0, minHeight: 0 }}>
            {catalog}
          </Box>
          {!isEditMode && (
            <Box
              display="flex"
              w="clamp(260px, 38vw, 320px)"
              style={{ flex: 'none', minHeight: 0 }}
            >
              {cart}
            </Box>
          )}
        </Flex>
      );
    }
    // Tablet: catalog 3 / cart 2. Desktop: unchanged (6 / 3).
    const isDesktop = mode === 'desktop';
    return (
      <Flex direction="row-reverse" style={{ flex: 1, minHeight: 0 }}>
        {!isEditMode && (
          <Box flex={isDesktop ? 3 : 2} p={0} display="flex" mih={0} miw={0}>
            {cart}
          </Box>
        )}
        <Box flex={isEditMode ? 1 : isDesktop ? 6 : 3} display="flex" mih={0} miw={0}>
          {catalog}
        </Box>
      </Flex>
    );
  };

  // Header pieces. Without a client name, "Caisse Claire" takes the title slot (D-040).
  const clientName = getClientName();
  const titleSize = mode === 'phone-portrait' ? 24 : mode === 'phone-landscape' ? 16 : 20;
  // Phone landscape shows the logo alone: it then carries the app name for screen readers.
  const logoCarriesName = mode === 'phone-landscape' && Boolean(clientName);
  const logo = (
    <BrandLogo
      size={mode === 'phone-landscape' ? 24 : 28}
      className={classes.logo}
      label={logoCarriesName ? APP_NAME : undefined}
    />
  );
  const title = (
    <h1
      className={classes.clientName}
      data-size={titleSize >= 24 ? 'large' : undefined}
      style={{ fontSize: titleSize }}
    >
      {clientName ?? APP_NAME}
    </h1>
  );
  // D-061 (answer 8 a): state of the cash day, opens the "Journée de caisse" modal.
  const openCashDay = () => setIsCashDayOpen(true);
  const actions = (
    <Group gap="xs" wrap="nowrap" align="center" style={{ flex: 'none' }}>
      {mode !== 'phone-portrait' && (
        <CashDayIndicator short={mode === 'phone-landscape'} onClick={openCashDay} />
      )}
      {isEditMode && !isPhone && (
        <Badge size="lg" tt="none" className={classes.editBadge}>
          {t('edit_mode.badge')}
        </Badge>
      )}
      {isEditMode && (
        <Button
          h={44}
          leftSection={<IconCheck size={20} />}
          onClick={() => dispatch(exitEditMode())}
        >
          {t('edit_mode.done')}
        </Button>
      )}
      {isPhone && !isEditMode && (
        <ActionIcon
          variant="subtle"
          size={44}
          onClick={() => setIsOrderModalOpen(true)}
          aria-label={t('history')}
        >
          <IconHistory size={26} stroke={1.5} />
        </ActionIcon>
      )}
      <Menu width={300} position="bottom-end">
        <Menu.Target>
          <ActionIcon variant="subtle" size={44} aria-label={t('edit_mode.toggle')}>
            <IconSettings size={26} stroke={1.5} />
          </ActionIcon>
        </Menu.Target>
        <Menu.Dropdown p="xs">
          {/* D-063 (answer 8 a): who is logged in, information only. */}
          {user && (
            <>
              <Group
                gap="sm"
                px="sm"
                py="xs"
                wrap="nowrap"
                align="flex-start"
                data-testid="current-user"
              >
                <IconUser size={20} aria-hidden style={{ flex: 'none', marginTop: 2 }} />
                <Stack gap={2} style={{ minWidth: 0 }}>
                  <Text
                    fz={16}
                    fw={700}
                    className={classes.userName}
                    data-testid="current-user-name"
                  >
                    {user.username}
                  </Text>
                  <Text fz={14} className={classes.userRole}>
                    {t(`auth.roles.${user.role}`)}
                  </Text>
                </Stack>
              </Group>
              <Menu.Divider />
            </>
          )}
          <Menu.Item
            onClick={() => dispatch(toggleEditMode())}
            leftSection={<IconPencil size={20} />}
            py="md"
            style={{ fontSize: 'var(--mantine-font-size-lg)' }}
          >
            {isEditMode ? t('edit_mode.exit') : t('edit_mode.toggle')}
          </Menu.Item>
          <Menu.Item
            onClick={openCashDay}
            leftSection={<IconCalendarEvent size={20} />}
            py="md"
            style={{ fontSize: 'var(--mantine-font-size-lg)' }}
          >
            {t('cash_day.title')}
          </Menu.Item>
          <Menu.Divider />
          <ColorSchemeControl />
          <Menu.Divider />
          {/* D-008: read-only, the currency is set by the instance configuration. */}
          <Group
            gap="sm"
            px="sm"
            py="xs"
            wrap="nowrap"
            align="flex-start"
            data-testid="currency-info"
          >
            <IconLock size={20} color="var(--mantine-color-dimmed)" style={{ flex: 'none' }} />
            <Stack gap={2}>
              <Text size="lg">
                {t('currency.menu_label', { name: t(`currency.names.${currency}`) })}
              </Text>
              <Text size="xs" c="dimmed">
                {t('currency.instance_config')}
              </Text>
            </Stack>
          </Group>
          <Menu.Item
            onClick={() => setIsAboutOpen(true)}
            leftSection={<IconInfoCircle size={20} />}
            py="md"
            style={{ fontSize: 'var(--mantine-font-size-lg)' }}
          >
            {t('about.menu')}
          </Menu.Item>
          <Menu.Divider />
          {/* Last, not red: nothing is lost, the cart stays on the device (point 5). */}
          <Menu.Item
            onClick={logOut}
            leftSection={<IconLogout size={20} />}
            py="md"
            style={{ fontSize: 'var(--mantine-font-size-lg)' }}
          >
            {t('auth.logout')}
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </Group>
  );

  return (
    <Flex direction="column" style={{ height: '100%', width: '100%' }}>
      {/* Global header: docs/design/components.md, "En-tête global" (D-040). */}
      <Box
        component="header"
        className={classes.header}
        data-edit-mode={isEditMode || undefined}
        px={isPhone ? 8 : 'md'}
      >
        {mode === 'phone-portrait' ? (
          <>
            <Group h={56} justify="space-between" wrap="nowrap" gap="sm" pl={8}>
              <Group gap="xs" wrap="nowrap">
                {logo}
                {clientName && <span className={classes.appName}>{APP_NAME}</span>}
              </Group>
              {actions}
            </Group>
            <Box px={8} pb={8}>
              {title}
              <Box mt={8}>
                <CashDayIndicator wrap onClick={openCashDay} />
              </Box>
            </Box>
          </>
        ) : (
          <Group
            mih={mode === 'phone-landscape' ? 44 : 64}
            py={mode === 'phone-landscape' ? 0 : 'xs'}
            justify="space-between"
            wrap="nowrap"
            gap="sm"
          >
            <Group gap="sm" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
              <Group gap="xs" wrap="nowrap" style={{ flex: 'none' }}>
                {logo}
                {clientName && mode !== 'phone-landscape' && (
                  <span className={classes.appName}>{APP_NAME}</span>
                )}
              </Group>
              <Box style={{ flex: 1, minWidth: 0 }}>{title}</Box>
            </Group>
            {actions}
          </Group>
        )}
      </Box>

      {/* Main Content */}
      {renderMain()}

      <OrderHistoryModal isOpen={isOrderModalOpen} onClose={() => setIsOrderModalOpen(false)} />
      <CartConfirmationModal
        isOpen={isCartConfirmationModalOpen}
        onClose={() => setIsCartConfrimationModalOpen(false)}
        // The cart is collapsed after each sale (phone portrait Drawer).
        onOrderPlaced={() => setIsCartDrawerOpen(false)}
      />
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
      <CashDayModal isOpen={isCashDayOpen} onClose={() => setIsCashDayOpen(false)} />
    </Flex>
  );
}
