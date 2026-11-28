import React from 'react';
import { Badge, Button, Card, Group, Stack, Text } from '@mantine/core';
import { IconBan, IconKey, IconUserCheck, IconUserCog, IconUserOff } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import type { UserAccountType } from 'shared-ts';
import classes from './Accounts.module.css';

interface AccountCardProps {
  account: UserAccountType;
  /** The account of the logged-in admin: "Vous", no action (D-063 point 12, answer 12 a). */
  isSelf: boolean;
  /** The only active admin: neither "Désactiver" nor the role (answer 8 a). */
  isLastAdmin: boolean;
  busy: boolean;
  onChangeRole: () => void;
  onResetPassword: () => void;
  onDeactivate: () => void;
  onReactivate: () => void;
}

/**
 * One account of "Comptes" (answer 7 a): name, role written below, "Vous" and "Désactivé"
 * badges. Actions are visible buttons, each naming the account for screen readers. An action
 * that does not apply is not rendered (no dead button). A disabled account offers no reset
 * (answer 13 b): it is reactivated first.
 */
export const AccountCard: React.FC<AccountCardProps> = ({
  account,
  isSelf,
  isLastAdmin,
  busy,
  onChangeRole,
  onResetPassword,
  onDeactivate,
  onReactivate,
}) => {
  const { t } = useTranslation();
  const name = account.username;
  const canChangeRole = !isSelf && !isLastAdmin;
  const canReset = !isSelf && account.active;
  const canDeactivate = !isSelf && !isLastAdmin && account.active;
  const canReactivate = !account.active;

  return (
    <Card
      withBorder
      radius="lg"
      p="md"
      className={classes.card}
      data-disabled={!account.active || undefined}
      data-testid="account-card"
    >
      <Stack gap="sm">
        <Group gap="xs" wrap="nowrap" align="flex-start" justify="space-between">
          <Stack gap={2} style={{ minWidth: 0 }}>
            <Text className={classes.name} component="h3" m={0}>
              {name}
            </Text>
            <Text className={classes.secondary}>{t(`auth.roles.${account.role}`)}</Text>
          </Stack>
          <Group gap={6} wrap="nowrap" className={classes.badge}>
            {isSelf && (
              <Badge variant="default" tt="none" size="lg">
                {t('accounts.you')}
              </Badge>
            )}
            {!account.active && (
              <Badge
                variant="default"
                tt="none"
                size="lg"
                leftSection={<IconBan size={16} aria-hidden />}
              >
                {t('accounts.disabled')}
              </Badge>
            )}
          </Group>
        </Group>

        {isSelf && <Text className={classes.secondary}>{t('accounts.self_help')}</Text>}
        {!isSelf && isLastAdmin && (
          <Text className={classes.secondary}>{t('accounts.last_admin_help')}</Text>
        )}

        {(canChangeRole || canReset || canDeactivate || canReactivate) && (
          <Group gap={8} wrap="wrap">
            {canReactivate && (
              <Button
                h={44}
                disabled={busy}
                leftSection={<IconUserCheck size={20} aria-hidden />}
                aria-label={t('accounts.aria.reactivate', { name })}
                onClick={onReactivate}
              >
                {t('accounts.reactivate')}
              </Button>
            )}
            {canChangeRole && (
              <Button
                variant="default"
                h={44}
                disabled={busy}
                leftSection={<IconUserCog size={20} aria-hidden />}
                aria-label={t('accounts.aria.change_role', { name })}
                onClick={onChangeRole}
              >
                {t('accounts.change_role')}
              </Button>
            )}
            {canReset && (
              <Button
                variant="default"
                h={44}
                disabled={busy}
                leftSection={<IconKey size={20} aria-hidden />}
                aria-label={t('accounts.aria.reset_password', { name })}
                onClick={onResetPassword}
              >
                {t('accounts.reset_password')}
              </Button>
            )}
            {canDeactivate && (
              <Button
                color="red"
                variant="light"
                h={44}
                disabled={busy}
                leftSection={<IconUserOff size={20} aria-hidden />}
                aria-label={t('accounts.aria.deactivate', { name })}
                onClick={onDeactivate}
              >
                {t('accounts.deactivate')}
              </Button>
            )}
          </Group>
        )}
      </Stack>
    </Card>
  );
};

export default AccountCard;
