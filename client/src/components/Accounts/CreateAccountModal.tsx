import React, { useEffect, useRef, useState } from 'react';
import { Button, Modal, Radio, Stack, Text, TextInput } from '@mantine/core';
import { IconAlertTriangle, IconUserPlus } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import type { UserRole } from 'shared-ts';
import { useCreateUserMutation } from '../../services/users';
import { extractApiErrorCode } from '../../utils/extractApiError';
import { isPhoneMode, useLayoutMode } from '../../hooks/useLayoutMode';
import UnsavedChangesModal, { useUnsavedChangesGuard } from '../UnsavedChangesModal';
import { FIELD_INPUT_STYLES, FormMessage, PasswordField } from '../ChangePassword/PasswordField';
import { passwordLengthError } from '../../utils/password';
import passwordClasses from '../ChangePassword/Password.module.css';
import { accountErrorMessage, USERNAME_PATTERN } from './accountErrors';

export const ROLE_OPTIONS: readonly UserRole[] = ['admin', 'manager', 'cashier'];

interface CreateAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FieldError: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className={passwordClasses.fieldError}>
    <IconAlertTriangle size={16} aria-hidden style={{ flex: 'none', marginTop: 2 }} />
    <span>{children}</span>
  </span>
);

/**
 * "Nouveau compte" (D-064): username, password, role. The password is temporary (answer 3 a):
 * the account changes it at its first login. No role preselected, so that no admin is created
 * by mistake. Closing with changes asks first (D-052).
 */
const CreateAccountModal: React.FC<CreateAccountModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const isPhone = isPhoneMode(useLayoutMode());
  const [createUser, { isLoading }] = useCreateUserMutation();
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [roleError, setRoleError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setUsername('');
    setPassword('');
    setRole(null);
    setUsernameError(null);
    setPasswordError(null);
    setRoleError(null);
    setMessage(null);
  }, [isOpen]);

  const guard = useUnsavedChangesGuard(
    () => username !== '' || password !== '' || role !== null,
    onClose
  );

  const submit = async () => {
    if (isLoading) return;
    setMessage(null);
    const name = username.trim();
    const nameError = USERNAME_PATTERN.test(name) ? null : t('accounts.errors.USERNAME_INVALID');
    const lengthError = passwordLengthError(password);
    const passError = lengthError ? t(lengthError) : null;
    const missingRole = role ? null : t('accounts.create.role_required');
    setUsernameError(nameError);
    setPasswordError(passError);
    setRoleError(missingRole);
    if (nameError || passError || !role) {
      // Saved from "Enregistrer les modifications ?": back to the form, on the faulty field.
      guard.keepEditing();
      if (nameError) usernameRef.current?.focus();
      else if (passError) passwordRef.current?.focus();
      return;
    }

    try {
      const account = await createUser({ username: name, password, role }).unwrap();
      toast.success(t('accounts.create.done', { name: account.username }));
      guard.discard();
    } catch (error) {
      guard.keepEditing();
      const code = extractApiErrorCode(error);
      if (code === 'USERNAME_TAKEN' || code === 'USERNAME_INVALID') {
        setUsernameError(accountErrorMessage(error, t));
        usernameRef.current?.focus();
      } else if (code === 'PASSWORD_INVALID') {
        setPasswordError(accountErrorMessage(error, t));
        passwordRef.current?.focus();
      } else {
        setMessage(accountErrorMessage(error, t));
      }
    }
  };

  return (
    <>
      <Modal
        opened={isOpen}
        onClose={guard.requestClose}
        title={t('accounts.create.title')}
        centered
        fullScreen={isPhone}
        closeButtonProps={{ size: 44, 'aria-label': t('close') }}
      >
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <Stack gap="md">
            {message && <FormMessage tone="error">{message}</FormMessage>}
            <TextInput
              ref={usernameRef}
              data-autofocus
              label={t('accounts.create.username')}
              name="new-account-username"
              value={username}
              onChange={(event) => {
                setUsername(event.currentTarget.value);
                setUsernameError(null);
              }}
              description={t('accounts.create.username_help')}
              inputWrapperOrder={['label', 'input', 'description', 'error']}
              error={usernameError ? <FieldError>{usernameError}</FieldError> : undefined}
              classNames={{ description: passwordClasses.help }}
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              maxLength={64}
              styles={FIELD_INPUT_STYLES}
              disabled={isLoading}
            />
            <PasswordField
              ref={passwordRef}
              label={t('accounts.create.password')}
              name="new-account-password"
              value={password}
              onChange={(value) => {
                setPassword(value);
                setPasswordError(null);
              }}
              autoComplete="new-password"
              description={t('accounts.create.password_help')}
              error={passwordError}
              disabled={isLoading}
            />
            <Text className={passwordClasses.help}>{t('accounts.create.temporary_help')}</Text>
            <Radio.Group
              label={t('accounts.create.role')}
              value={role}
              onChange={(value) => {
                setRole(value as UserRole);
                setRoleError(null);
              }}
              error={roleError ? <FieldError>{roleError}</FieldError> : undefined}
            >
              <Stack gap="sm" mt="xs">
                {ROLE_OPTIONS.map((option) => (
                  <Radio
                    key={option}
                    value={option}
                    label={t(`auth.roles.${option}`)}
                    size="md"
                    disabled={isLoading}
                  />
                ))}
              </Stack>
            </Radio.Group>
            <Button
              type="submit"
              h={56}
              fullWidth
              fz={18}
              fw={800}
              loading={isLoading}
              leftSection={<IconUserPlus size={22} aria-hidden />}
            >
              {t('accounts.create.submit')}
            </Button>
          </Stack>
        </form>
      </Modal>
      <UnsavedChangesModal
        isOpen={guard.isPromptOpen}
        onKeepEditing={guard.keepEditing}
        onDiscard={guard.discard}
        onSave={() => void submit()}
        isSaving={isLoading}
      />
    </>
  );
};

export default CreateAccountModal;
