import { useState } from 'react';
import { Badge, Box, Button, Flex, Menu, ActionIcon, Group, Stack, Text } from '@mantine/core';
import {
  IconCheck,
  IconHistory,
  IconInfoCircle,
  IconLock,
  IconPencil,
  IconSettings,
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
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);

  // Header action size: 56 (portrait), 44 (landscape); tablet and desktop keep 60 x full height.
  const phoneIconSize = mode === 'phone-landscape' ? 44 : 56;
  const headerHeight = mode === 'phone-landscape' ? 44 : isPhone ? 56 : undefined;

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

  return (
    <Flex direction="column" style={{ height: '100%', width: '100%' }}>
      {/* Global Header */}
      <Group
        bg="var(--mantine-color-default)"
        style={{
          borderBottom: isEditMode
            ? '2px solid var(--mantine-primary-color-filled)'
            : '1px solid var(--mantine-color-default-border)',
          flex: 'none',
        }}
        h={headerHeight}
        justify="space-between"
        align="stretch"
        gap={0}
        wrap="nowrap"
      >
        <Text
          size={mode === 'phone-landscape' ? 'lg' : 'xl'}
          fw={700}
          c="orange"
          px="md"
          py={isPhone ? 0 : 'md'}
          style={{ alignContent: 'center', whiteSpace: 'nowrap' }}
        >
          Token Register
        </Text>
        <Group gap="xs" wrap="nowrap" align="center">
          {isEditMode && !isPhone && (
            <Badge size="lg" color="yellow">
              {t('edit_mode.badge')}
            </Badge>
          )}
          {isEditMode && (
            <Button
              h={44}
              color="yellow"
              leftSection={<IconCheck size={20} />}
              onClick={() => dispatch(exitEditMode())}
            >
              {t('edit_mode.done')}
            </Button>
          )}
          {isPhone && !isEditMode && (
            <ActionIcon
              variant="subtle"
              size={phoneIconSize}
              radius={0}
              onClick={() => setIsOrderModalOpen(true)}
              aria-label={t('history')}
            >
              <IconHistory size={28} stroke={1.5} />
            </ActionIcon>
          )}
          <Menu shadow="md" width={280}>
            <Menu.Target>
              <ActionIcon
                variant="subtle"
                w={isPhone ? phoneIconSize : 60}
                h={isPhone ? phoneIconSize : '100%'}
                radius={0}
                aria-label={t('edit_mode.toggle')}
              >
                <IconSettings size={28} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown p="xs">
              <Menu.Item
                onClick={() => dispatch(toggleEditMode())}
                leftSection={<IconPencil size={20} />}
                py="md"
                style={{ fontSize: 'var(--mantine-font-size-lg)' }}
              >
                {isEditMode ? t('edit_mode.exit') : t('edit_mode.toggle')}
              </Menu.Item>
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
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Group>

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
    </Flex>
  );
}
