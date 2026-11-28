import React from 'react';
import { Modal, Radio, Stack } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import type { UserAccountType, UserRole } from 'shared-ts';
import { useUpdateUserMutation } from '../../services/users';
import { accountErrorMessage } from './accountErrors';
import { ROLE_OPTIONS } from './CreateAccountModal';

interface RoleModalProps {
  account: UserAccountType | null;
  onClose: () => void;
}

/**
 * Role of an account (D-064, answer 6 a): a touch applies it, without confirmation, and a toast
 * confirms it. It applies at once, even to an open session (D-063 point 15). A refusal (409,
 * e.g. last active admin) is said in an error toast, the modal stays open.
 */
const RoleModal: React.FC<RoleModalProps> = ({ account, onClose }) => {
  const { t } = useTranslation();
  const [updateUser, { isLoading }] = useUpdateUserMutation();

  const choose = async (role: UserRole) => {
    if (!account || isLoading || role === account.role) return;
    try {
      await updateUser({ id: account.id, role }).unwrap();
      toast.success(
        t('accounts.role.done', { name: account.username, role: t(`auth.roles.${role}`) })
      );
      onClose();
    } catch (error) {
      toast.error(accountErrorMessage(error, t), { autoClose: 5000 });
    }
  };

  return (
    <Modal
      opened={account !== null}
      onClose={onClose}
      title={account ? t('accounts.role.title', { name: account.username }) : ''}
      centered
      closeButtonProps={{ size: 44, 'aria-label': t('close') }}
      styles={{ title: { overflowWrap: 'anywhere' } }}
    >
      {account && (
        <Radio.Group
          label={t('accounts.role.label')}
          value={account.role}
          onChange={(value) => void choose(value as UserRole)}
        >
          <Stack gap="md" mt="sm" pb="xs">
            {ROLE_OPTIONS.map((role) => (
              <Radio
                key={role}
                value={role}
                label={t(`auth.roles.${role}`)}
                size="md"
                disabled={isLoading}
                data-autofocus={role === account.role || undefined}
              />
            ))}
          </Stack>
        </Radio.Group>
      )}
    </Modal>
  );
};

export default RoleModal;
