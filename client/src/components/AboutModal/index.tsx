import React from 'react';
import {
  Badge,
  Button,
  Flex,
  Group,
  Modal,
  Stack,
  Text,
  Title,
  useMantineTheme,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { useTranslation } from 'react-i18next';
import { APP_NAME, getAppVersionInfo } from '../../config/version';
import logoUrl from '../../assets/brand/logo.svg';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const theme = useMantineTheme();
  const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`);
  const info = getAppVersionInfo();

  const envBadge =
    info.channel === 'demo' ? (
      <Badge variant="light" tt="none">
        {t('about.env.demo')}
      </Badge>
    ) : info.channel === 'development' ? (
      <Badge variant="default" tt="none">
        {t('about.env.dev')}
      </Badge>
    ) : null;

  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      title={t('about.title')}
      centered
      fullScreen={isMobile}
      closeButtonProps={{ size: 44 }}
    >
      {/* docs/design/components.md, "À propos" (D-040: app name and version, not the client). */}
      <Stack align="center" gap="xs" ta="center">
        <img src={logoUrl} width={64} height={64} alt="" aria-hidden />
        <Title order={2} fz={24} fw={800}>
          {APP_NAME}
        </Title>
        <Text c="dimmed">{t('app.tagline')}</Text>
        <Group gap="sm" justify="center">
          <Text size="sm" c="dimmed" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {t('about.version', { version: info.version })}
          </Text>
          {envBadge}
        </Group>
        {info.commit && (
          <Group gap="sm" justify="center">
            <Text size="sm" c="dimmed">
              {t('about.commit')}
            </Text>
            <Text size="sm" ff="monospace">
              {info.commit}
            </Text>
          </Group>
        )}
        <Flex justify="flex-end" mt="md" w="100%">
          <Button size="lg" fullWidth={isMobile} onClick={onClose}>
            {t('close')}
          </Button>
        </Flex>
      </Stack>
    </Modal>
  );
};

export default AboutModal;
