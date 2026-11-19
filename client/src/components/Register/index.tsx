import { useState } from 'react';
import { Box, Flex, Menu, ActionIcon, Group, Stack, Text } from '@mantine/core';
import { IconInfoCircle, IconLock, IconPencil, IconSettings } from '@tabler/icons-react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import Catalog from '../Catalog';
import Cart from '../Cart';
import OrderHistoryModal from '../OrderHistoryModal';
import AboutModal from '../AboutModal';
import CartConfirmationModal from '../CartConfirmationModal';
import { toggleEditMode, selectIsEditMode } from '../../redux/editModeSlice';
import { useCurrency } from '../../hooks/useCurrency';

export function Register(): React.ReactElement {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const isEditMode = useSelector(selectIsEditMode);
  const { currency } = useCurrency();
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isCartConfirmationModalOpen, setIsCartConfrimationModalOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  return (
    <Flex direction="column" style={{ height: '100%', width: '100%' }}>
      {/* Global Header */}
      <Group
        bg="var(--mantine-color-default)"
        style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}
        justify="space-between"
        align="stretch"
        gap={0}
        wrap="nowrap"
      >
        <Text size="xl" fw={700} c="orange" px="md" py="md" style={{ alignContent: 'center' }}>
          Token Register
        </Text>
        <Menu shadow="md" width={280}>
          <Menu.Target>
            <ActionIcon
              variant="subtle"
              w={60}
              h="100%"
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

      {/* Main Content */}
      <Flex
        direction={{ base: 'column-reverse', sm: 'row-reverse' }}
        style={{ flex: 1, minHeight: 0 }}
      >
        {!isEditMode && (
          <Box flex={{ base: 1.5, sm: 2, md: 3 }} p={0} display="flex" mih={0}>
            <Cart
              onClickHistory={() => setIsOrderModalOpen(true)}
              onValidateCart={() => setIsCartConfrimationModalOpen(true)}
            />
          </Box>
        )}
        <Box flex={isEditMode ? 1 : { base: 2, sm: 3, md: 6 }} display="flex" mih={0}>
          <Catalog />
        </Box>
      </Flex>

      <OrderHistoryModal isOpen={isOrderModalOpen} onClose={() => setIsOrderModalOpen(false)} />
      <CartConfirmationModal
        isOpen={isCartConfirmationModalOpen}
        onClose={() => setIsCartConfrimationModalOpen(false)}
      />
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
    </Flex>
  );
}
