import React from 'react';
import { Box, Button, Paper, Stack } from '@mantine/core';
import { IconLogout } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { useLayoutMode } from '../../hooks/useLayoutMode';
import { getClientName } from '../../config/client';
import { APP_NAME } from '../../config/version';
import BrandLogo from '../BrandLogo';
import ChangePasswordForm from './ChangePasswordForm';
import { FormMessage } from './PasswordField';
import loginClasses from '../Login/Login.module.css';

/**
 * Temporary password (D-064, answers 3 a and 2 a): full screen in place of the register, laid
 * out like the login, without a cross nor Escape. The API refuses everything else meanwhile.
 * "Se déconnecter" stays visible. On success, the register opens directly (answer 4 a).
 */
export const ForcedPasswordChange: React.FC = () => {
  const { t } = useTranslation();
  const { logOut } = useAuth();
  const mode = useLayoutMode();
  const clientName = getClientName();

  return (
    <Box className={loginClasses.screen} data-mode={mode} component="main">
      <div className={loginClasses.layout}>
        <Stack gap={4} className={loginClasses.brand}>
          <BrandLogo size={28} className={loginClasses.logo} />
          <h1 className={loginClasses.title}>{clientName ?? APP_NAME}</h1>
          {clientName && <span className={loginClasses.appName}>{APP_NAME}</span>}
        </Stack>
        <Paper
          component="section"
          className={loginClasses.panel}
          p="md"
          aria-label={t('auth.change_password.forced_label')}
          data-testid="forced-password-change"
        >
          <Stack gap="md">
            <FormMessage tone="info">{t('auth.change_password.forced_notice')}</FormMessage>
            {/* Nothing to do on success: the flag is cleared, AuthGate shows the register. */}
            <ChangePasswordForm variant="temporary" autoFocus onSuccess={() => {}} />
            <Button
              variant="subtle"
              h={44}
              fullWidth
              leftSection={<IconLogout size={20} aria-hidden />}
              onClick={logOut}
            >
              {t('auth.logout')}
            </Button>
          </Stack>
        </Paper>
      </div>
    </Box>
  );
};

export default ForcedPasswordChange;
