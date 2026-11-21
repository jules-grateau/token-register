import React from 'react';
import { Badge, Button, Flex, Group, Modal, Stack, Text, Title } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { APP_NAME, getAppVersionInfo } from '../../config/version';
import BrandLogo from '../BrandLogo';
import { isPhoneMode, useLayoutMode } from '../../hooks/useLayoutMode';

const SECONDARY = 'var(--color-text-2)';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  // Full screen on phones, portrait and landscape (useLayoutMode, like the other modals).
  const isMobile = isPhoneMode(useLayoutMode());
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
      closeButtonProps={{ size: 44, 'aria-label': t('close') }}
    >
      {/* docs/design/components.md, "À propos" (D-040: app name and version, not the client). */}
      <Stack align="center" gap="xs" ta="center">
        <BrandLogo size={64} />
        <Title order={2} fz={24} fw={800}>
          {APP_NAME}
        </Title>
        <Text c={SECONDARY}>{t('app.tagline')}</Text>
        <Group gap="sm" justify="center">
          <Text size="sm" c={SECONDARY} style={{ fontVariantNumeric: 'tabular-nums' }}>
            {t('about.version', { version: info.version })}
          </Text>
          {envBadge}
        </Group>
        {info.commit && (
          <Group gap="sm" justify="center">
            <Text size="sm" c={SECONDARY}>
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
