import React, { useEffect, useRef, useState } from 'react';
import { Button, Stack } from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { changePassword } from '../../services/auth';
import { passwordChanged, sessionExpired } from '../../redux/authSlice';
import { passwordLengthError } from '../../utils/password';
import { FormMessage, PasswordField } from './PasswordField';

interface ChangePasswordFormProps {
  /** "own": from ⚙️; "temporary": the screen after a reset or a creation (D-064). */
  variant: 'own' | 'temporary';
  onSuccess: () => void;
  /** First field focused when the form appears (modal opening, screen). */
  autoFocus?: boolean;
}

/**
 * Current (or temporary) password, new one typed twice (answer 5 a), each with its own eye.
 * A wrong current password clears that field only and puts the focus back in it, with a
 * generic message, like the login. On success, the session in use is kept (answer 4 a).
 */
export const ChangePasswordForm: React.FC<ChangePasswordFormProps> = ({
  variant,
  onSuccess,
  autoFocus = false,
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const currentRef = useRef<HTMLInputElement>(null);
  const newRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLInputElement>(null);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [newError, setNewError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [waiting, setWaiting] = useState(false);
  // Bumped after a wrong current password: the field is focused once enabled again.
  const [refusals, setRefusals] = useState(0);
  const waitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const temporary = variant === 'temporary';

  useEffect(() => {
    if (autoFocus) currentRef.current?.focus();
  }, [autoFocus]);
  useEffect(() => {
    if (refusals > 0) currentRef.current?.focus();
  }, [refusals]);
  useEffect(
    () => () => {
      if (waitTimer.current) clearTimeout(waitTimer.current);
    },
    []
  );

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting || waiting) return;
    setMessage(null);
    const lengthError = passwordLengthError(next);
    const sameError =
      !lengthError && next === current
        ? temporary
          ? 'auth.change_password.same_temporary'
          : 'auth.change_password.same'
        : null;
    const mismatch = !lengthError && confirm !== next ? 'auth.change_password.mismatch' : null;
    setNewError(lengthError ?? sameError);
    setConfirmError(mismatch);
    if (lengthError || sameError) {
      newRef.current?.focus();
      return;
    }
    if (mismatch) {
      confirmRef.current?.focus();
      return;
    }

    setSubmitting(true);
    const result = await changePassword({ currentPassword: current, newPassword: next });
    setSubmitting(false);
    if (result.ok) {
      dispatch(passwordChanged(result.user));
      onSuccess();
      return;
    }
    switch (result.reason) {
      case 'wrong_current':
        setCurrent('');
        setMessage(
          t(
            temporary
              ? 'auth.change_password.wrong_temporary'
              : 'auth.change_password.wrong_current'
          )
        );
        setRefusals((n) => n + 1);
        break;
      case 'too_many':
        setMessage(t('auth.too_many'));
        setWaiting(true);
        waitTimer.current = setTimeout(() => setWaiting(false), result.retryAfterSeconds * 1000);
        break;
      case 'same':
        setNewError(
          temporary ? 'auth.change_password.same_temporary' : 'auth.change_password.same'
        );
        newRef.current?.focus();
        break;
      case 'invalid':
        setNewError('auth.change_password.too_short');
        newRef.current?.focus();
        break;
      case 'expired':
        dispatch(sessionExpired());
        break;
      default:
        setMessage(t('errors.network'));
    }
  };

  return (
    <form onSubmit={(event) => void submit(event)} noValidate>
      <Stack gap="md">
        {message && <FormMessage tone="error">{message}</FormMessage>}
        <PasswordField
          ref={currentRef}
          label={t(temporary ? 'auth.change_password.temporary' : 'auth.change_password.current')}
          name="current-password"
          value={current}
          onChange={setCurrent}
          autoComplete="current-password"
          disabled={submitting}
        />
        <PasswordField
          ref={newRef}
          label={t('auth.change_password.new')}
          name="new-password"
          value={next}
          onChange={(value) => {
            setNext(value);
            setNewError(null);
          }}
          autoComplete="new-password"
          description={t('auth.change_password.new_help')}
          error={newError ? t(newError) : null}
          disabled={submitting}
        />
        <PasswordField
          ref={confirmRef}
          label={t('auth.change_password.confirm')}
          name="confirm-password"
          value={confirm}
          onChange={(value) => {
            setConfirm(value);
            setConfirmError(null);
          }}
          autoComplete="new-password"
          error={confirmError ? t(confirmError) : null}
          disabled={submitting}
        />
        <Button
          type="submit"
          h={56}
          fullWidth
          fz={18}
          fw={800}
          loading={submitting}
          disabled={waiting}
          leftSection={<IconCheck size={22} aria-hidden />}
        >
          {t(temporary ? 'auth.change_password.forced_submit' : 'auth.change_password.submit')}
        </Button>
      </Stack>
    </form>
  );
};

export default ChangePasswordForm;
