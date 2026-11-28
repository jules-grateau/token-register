import React, { useEffect, useRef, useState } from 'react';
import { Box, Button, Paper, PasswordInput, Stack, TextInput } from '@mantine/core';
import {
  IconAlertTriangle,
  IconEye,
  IconEyeOff,
  IconInfoCircle,
  IconLogin,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { login } from '../../services/auth';
import { loggedIn, selectAuthNotice } from '../../redux/authSlice';
import { useLayoutMode } from '../../hooks/useLayoutMode';
import { getClientName } from '../../config/client';
import { APP_NAME } from '../../config/version';
import BrandLogo from '../BrandLogo';
import classes from './Login.module.css';

// docs/design/components.md: fields 48 px high, text 16 px (no iOS zoom). Inline on the input:
// Mantine's size variables (inline too) win over the theme class.
const FIELD = { height: 48, minHeight: 48, fontSize: 16 };
const FIELD_STYLES = { input: FIELD, innerInput: FIELD };
// Eye of the password field: 44 x 44 touch target.
const EYE_STYLES = { width: 44, height: 44, minWidth: 44, minHeight: 44 };

type Message = { tone: 'error' | 'info'; text: string } | null;

/**
 * Login screen (D-063, docs/design/components.md, "Écran de connexion"). One message for every
 * refusal (answer 6 a); after 5 failures, the button waits (no countdown). A session that ended
 * during use is said in a neutral tone (answer 7 a). The cart is kept on the device.
 */
export const Login: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const notice = useSelector(selectAuthNotice);
  const mode = useLayoutMode();
  const clientName = getClientName();
  const passwordRef = useRef<HTMLInputElement>(null);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [waiting, setWaiting] = useState(false);
  // Bumped after a refusal: the password field gets the focus once it is enabled again.
  const [refusals, setRefusals] = useState(0);
  const [message, setMessage] = useState<Message>(
    notice === 'expired' ? { tone: 'info', text: t('auth.expired') } : null
  );

  useEffect(() => {
    if (refusals > 0) passwordRef.current?.focus();
  }, [refusals]);

  const waitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (waitTimer.current) clearTimeout(waitTimer.current);
    },
    []
  );

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting || waiting) return;
    setSubmitting(true);
    const result = await login({ username, password });
    setSubmitting(false);
    if (result.ok) {
      dispatch(loggedIn(result.user));
      return;
    }
    if (result.reason === 'invalid') {
      // Only the password is cleared, and the focus goes back to it.
      setPassword('');
      setMessage({ tone: 'error', text: t('auth.invalid') });
      setRefusals((n) => n + 1);
    } else if (result.reason === 'too_many') {
      setMessage({ tone: 'error', text: t('auth.too_many') });
      setWaiting(true);
      waitTimer.current = setTimeout(() => setWaiting(false), result.retryAfterSeconds * 1000);
    } else {
      setMessage({ tone: 'error', text: t('errors.network') });
    }
  };

  const brand = (
    <Stack gap={4} className={classes.brand}>
      <BrandLogo size={28} className={classes.logo} />
      <h1 className={classes.title}>{clientName ?? APP_NAME}</h1>
      {clientName && <span className={classes.appName}>{APP_NAME}</span>}
    </Stack>
  );

  const form = (
    <Paper component="section" className={classes.panel} p="md" aria-label={t('auth.form_label')}>
      <form onSubmit={(event) => void submit(event)} noValidate>
        <Stack gap="md">
          {message && (
            <div
              className={classes.message}
              data-tone={message.tone}
              role={message.tone === 'error' ? 'alert' : 'status'}
            >
              {message.tone === 'error' ? (
                <IconAlertTriangle size={20} aria-hidden className={classes.messageIcon} />
              ) : (
                <IconInfoCircle size={20} aria-hidden className={classes.messageIcon} />
              )}
              <span>{message.text}</span>
            </div>
          )}
          <TextInput
            label={t('auth.username')}
            name="username"
            value={username}
            onChange={(event) => setUsername(event.currentTarget.value)}
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            styles={FIELD_STYLES}
            disabled={submitting}
          />
          <PasswordInput
            ref={passwordRef}
            label={t('auth.password')}
            name="password"
            value={password}
            onChange={(event) => setPassword(event.currentTarget.value)}
            autoComplete="current-password"
            autoCapitalize="none"
            autoCorrect="off"
            disabled={submitting}
            visible={visible}
            onVisibilityChange={setVisible}
            rightSectionWidth={48}
            styles={{ ...FIELD_STYLES, visibilityToggle: EYE_STYLES }}
            classNames={{ visibilityToggle: classes.eye }}
            visibilityToggleIcon={({ reveal }) =>
              reveal ? <IconEyeOff size={20} aria-hidden /> : <IconEye size={20} aria-hidden />
            }
            visibilityToggleButtonProps={{
              'aria-label': visible ? t('auth.hide_password') : t('auth.show_password'),
              tabIndex: 0,
            }}
          />
          <Button
            type="submit"
            h={56}
            fullWidth
            fz={18}
            fw={800}
            loading={submitting}
            disabled={waiting}
            leftSection={<IconLogin size={22} aria-hidden />}
          >
            {t('auth.submit')}
          </Button>
        </Stack>
      </form>
    </Paper>
  );

  return (
    <Box className={classes.screen} data-mode={mode} component="main">
      <div className={classes.layout}>
        {brand}
        {form}
      </div>
    </Box>
  );
};

/** Neutral screen while the session is checked: the register never flashes before the login. */
export const AuthSplash: React.FC = () => {
  const { t } = useTranslation();
  return (
    <Box className={classes.splash} role="status" aria-label={t('auth.loading')}>
      <BrandLogo size={48} className={classes.logo} />
    </Box>
  );
};

export default Login;
