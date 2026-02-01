import React, { useState } from 'react';
import { Box, Flex, Menu, ActionIcon, Group, Text } from '@mantine/core';
import { IconSettings } from '@tabler/icons-react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import Catalog from '../Catalog';
import Cart from '../Cart';
import OrderHistoryModal from '../OrderHistoryModal';
import CartConfirmationModal from '../CartConfirmationModal';
import { toggleEditMode, selectIsEditMode } from '../../redux/editModeSlice';

export const Register: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const isEditMode = useSelector(selectIsEditMode);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isCartConfirmationModalOpen, setIsCartConfrimationModalOpen] = useState(false);

  return (
    <Flex direction="column" style={{ height: '100%', width: '100%' }}>
      {/* Global Header */}
      <Box
        bg="var(--mantine-color-default)"
        style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}
        px="md"
        py="sm"
      >
        <Group justify="space-between" align="center">
          <Text size="lg" fw={700}>
            Token Register
          </Text>
          <Menu shadow="md" width={200}>
            <Menu.Target>
              <ActionIcon variant="subtle" size="lg" aria-label={t('edit_mode.toggle')}>
                <IconSettings size={20} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item onClick={() => dispatch(toggleEditMode())}>
                {isEditMode ? t('edit_mode.exit') : t('edit_mode.toggle')}
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Box>

      {/* Main Content */}
      <Flex
        direction={{ base: 'column-reverse', sm: 'row-reverse' }}
        style={{ flex: 1, minHeight: 0 }}
      >
        <Box flex={{ base: 1.5, sm: 2, md: 3 }} p={0} display="flex" mih={0}>
          <Cart
            onClickHistory={() => setIsOrderModalOpen(true)}
            onValidateCart={() => setIsCartConfrimationModalOpen(true)}
          />
        </Box>
        <Box flex={{ base: 2, sm: 3, md: 6 }} display="flex" mih={0}>
          <Catalog />
        </Box>
      </Flex>

      <OrderHistoryModal isOpen={isOrderModalOpen} onClose={() => setIsOrderModalOpen(false)} />
      <CartConfirmationModal
        isOpen={isCartConfirmationModalOpen}
        onClose={() => setIsCartConfrimationModalOpen(false)}
      />
    </Flex>
  );
};
