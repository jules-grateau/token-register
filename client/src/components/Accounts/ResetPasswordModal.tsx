import React, { useEffect, useRef, useState } from 'react';
import { Button, Modal, Stack, Text } from '@mantine/core';
import { IconKey } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import type { UserAccountType } from 'shared-ts';
import { useResetUserPasswordMutation } from '../../services/users';
import { extractApiErrorCode } from '../../utils/extractApiError';
import { isPhoneMode, useLayoutMode } from '../../hooks/useLayoutMode';
import { FormMessage, PasswordField } from '../ChangePassword/PasswordField';
import { passwordLengthError } from '../../utils/password';
import passwordClasses from '../ChangePassword/Password.module.css';
import { accountErrorMessage } from './accountErrors';

interface ResetPasswordModalProps {
  account: UserAccountType | null;
  onClose: () => void;
}

/**
 * Reset by the admin (D-063 point 10, answer 2 a): the admin types the temporary password and
 * gives it in person; it is never shown again (the toast does not repeat it). The account
 * chooses a new one at its next login, and its sessions are closed.
 */
const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({ account, onClose }) => {
  const { t } = useTranslation();
  const isPhone = isPhoneMode(useLayoutMode());
  const [resetPassword, { isLoading }] = useResetUserPasswordMutation();
  const passwordRef = useRef<HTMLInputElement>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setPassword('');
    setError(null);
    setMessage(null);
  }, [account?.id]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!account || isLoading) return;
    setMessage(null);
    const lengthError = passwordLengthError(password);
    if (lengthError) {
      setError(t(lengthError));
      passwordRef.current?.focus();
      return;
    }
    try {
      await resetPassword({ id: account.id, password }).unwrap();
      toast.success(t('accounts.reset.done', { name: account.username }));
      onClose();
    } catch (failure) {
      if (extractApiErrorCode(failure) === 'PASSWORD_INVALID') {
        setError(accountErrorMessage(failure, t));
        passwordRef.current?.focus();
      } else {
        setMessage(accountErrorMessage(failure, t));
      }
    }
  };

  return (
    <Modal
      opened={account !== null}
      onClose={onClose}
      title={t('accounts.reset.title')}
      centered
      fullScreen={isPhone}
      closeButtonProps={{ size: 44, 'aria-label': t('close') }}
    >
      {account && (
        <form noValidate onSubmit={(event) => void submit(event)}>
          <Stack gap="md">
            {message && <FormMessage tone="error">{message}</FormMessage>}
            <Text fz={16} fw={700} style={{ overflowWrap: 'anywhere' }}>
              {t('accounts.reset.account', { name: account.username })}
            </Text>
            <PasswordField
              ref={passwordRef}
              label={t('accounts.reset.password')}
              name="reset-password"
              value={password}
              onChange={(value) => {
                setPassword(value);
                setError(null);
              }}
              autoComplete="new-password"
              description={t('accounts.create.password_help')}
              error={error}
              disabled={isLoading}
            />
            <Text className={passwordClasses.help} fz={16}>
              {t('accounts.reset.help')}
            </Text>
            <Button
              type="submit"
              h={56}
              fullWidth
              fz={18}
              fw={800}
              loading={isLoading}
              leftSection={<IconKey size={22} aria-hidden />}
            >
              {t('accounts.reset.submit')}
            </Button>
          </Stack>
        </form>
      )}
    </Modal>
  );
};

export default ResetPasswordModal;
