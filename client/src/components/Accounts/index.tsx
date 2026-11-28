import React, { useState } from 'react';
import { Button, Center, Modal, Stack, Text } from '@mantine/core';
import { IconUserPlus } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import type { UserAccountType } from 'shared-ts';
import { useGetUsersQuery, useUpdateUserMutation } from '../../services/users';
import { useAuth } from '../../hooks/useAuth';
import { isPhoneMode, useLayoutMode } from '../../hooks/useLayoutMode';
import ConfirmationModal from '../ConfirmationModal';
import Loader from '../Loader';
import AccountCard from './AccountCard';
import CreateAccountModal from './CreateAccountModal';
import ResetPasswordModal from './ResetPasswordModal';
import RoleModal from './RoleModal';
import { accountErrorMessage } from './accountErrors';
import classes from './Accounts.module.css';

interface AccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * "Comptes" (D-063 points 9 to 12, D-064), admin only: list (active first, then by name, sorted
 * by the API), creation, role, password reset, deactivation and reactivation. Only the
 * deactivation asks for a confirmation (answer 6 a). Full screen on a phone (answer 1 a).
 */
const AccountsModal: React.FC<AccountsModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const isPhone = isPhoneMode(useLayoutMode());
  const { user } = useAuth();
  const users = useGetUsersQuery(undefined, { skip: !isOpen, refetchOnMountOrArgChange: true });
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [roleAccount, setRoleAccount] = useState<UserAccountType | null>(null);
  const [resetAccount, setResetAccount] = useState<UserAccountType | null>(null);
  const [deactivateAccount, setDeactivateAccount] = useState<UserAccountType | null>(null);

  const accounts = users.data ?? [];
  const activeAdmins = accounts.filter((a) => a.active && a.role === 'admin').length;

  const setActive = async (account: UserAccountType, active: boolean) => {
    try {
      await updateUser({ id: account.id, active }).unwrap();
      toast.success(
        t(active ? 'accounts.reactivated' : 'accounts.deactivated', { name: account.username })
      );
    } catch (error) {
      toast.error(accountErrorMessage(error, t), { autoClose: 5000 });
    } finally {
      setDeactivateAccount(null);
    }
  };

  const renderList = () => {
    if (users.isError && !users.data) {
      return (
        <Stack gap="md" align="flex-start">
          <Text fz={16}>{t('accounts.load_error')}</Text>
          <Button variant="default" h={44} onClick={() => void users.refetch()}>
            {t('accounts.retry')}
          </Button>
        </Stack>
      );
    }
    if (!users.data) {
      return (
        <Center mih={112}>
          <Loader isLoading={true} />
        </Center>
      );
    }
    return (
      <Stack gap="sm" component="ul" aria-label={t('accounts.list_label')} m={0} p={0}>
        {accounts.map((account) => (
          <li key={account.id} style={{ listStyle: 'none' }}>
            <AccountCard
              account={account}
              isSelf={account.id === user?.id}
              isLastAdmin={account.active && account.role === 'admin' && activeAdmins <= 1}
              busy={isUpdating}
              onChangeRole={() => setRoleAccount(account)}
              onResetPassword={() => setResetAccount(account)}
              onDeactivate={() => setDeactivateAccount(account)}
              onReactivate={() => void setActive(account, true)}
            />
          </li>
        ))}
      </Stack>
    );
  };

  return (
    <>
      <Modal
        opened={isOpen}
        onClose={onClose}
        title={t('accounts.title')}
        size="lg"
        centered
        fullScreen={isPhone}
        closeButtonProps={{ size: 44, 'aria-label': t('close') }}
        classNames={{ content: classes.content, header: classes.header, body: classes.body }}
      >
        <div className={classes.list} data-testid="accounts-list">
          {renderList()}
        </div>
        <div className={classes.footer}>
          <Button
            h={56}
            fz={18}
            fw={800}
            fullWidth
            leftSection={<IconUserPlus size={22} aria-hidden />}
            onClick={() => setIsCreateOpen(true)}
          >
            {t('accounts.new')}
          </Button>
        </div>
      </Modal>
      <CreateAccountModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
      <RoleModal account={roleAccount} onClose={() => setRoleAccount(null)} />
      <ResetPasswordModal account={resetAccount} onClose={() => setResetAccount(null)} />
      <ConfirmationModal
        isOpen={deactivateAccount !== null}
        onClose={() => !isUpdating && setDeactivateAccount(null)}
        onConfirm={() => deactivateAccount && void setActive(deactivateAccount, false)}
        title={
          deactivateAccount
            ? t('accounts.deactivate_confirm.title', { name: deactivateAccount.username })
            : ''
        }
        confirmButtonText={t('accounts.deactivate')}
        destructive
        loading={isUpdating}
        stacked={isPhone}
      >
        <Text fz={16} style={{ overflowWrap: 'anywhere' }}>
          {deactivateAccount &&
            t('accounts.deactivate_confirm.text', { name: deactivateAccount.username })}
        </Text>
      </ConfirmationModal>
    </>
  );
};

export default AccountsModal;
