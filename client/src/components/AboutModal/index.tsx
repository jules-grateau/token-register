import React from 'react';
import {
  Badge,
  Button,
  CopyButton,
  Flex,
  Group,
  Modal,
  Stack,
  Text,
  Title,
  useMantineTheme,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconCheck, IconCopy } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { APP_NAME, formatVersionForClipboard, getAppVersionInfo } from '../../config/version';

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
      <Badge variant="light" color="orange">
        {t('about.env.demo')}
      </Badge>
    ) : info.channel === 'development' ? (
      <Badge variant="light" color="gray">
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
      closeButtonProps={{ size: 'lg' }}
    >
      <Stack>
        <Title order={3}>{APP_NAME}</Title>
        <Group gap="sm">
          <Text size="xl" fw={700}>
            {t('about.version', { version: info.version })}
          </Text>
          {envBadge}
        </Group>
        {info.commit && (
          <Group gap="sm">
            <Text c="dimmed">{t('about.commit')}</Text>
            <Text ff="monospace">{info.commit}</Text>
          </Group>
        )}
        <Flex direction={isMobile ? 'column' : 'row'} justify="flex-end" gap="sm" mt="md">
          <CopyButton value={formatVersionForClipboard(info)}>
            {({ copied, copy }) => (
              <Button
                variant="light"
                size="lg"
                fullWidth={isMobile}
                leftSection={copied ? <IconCheck size={20} /> : <IconCopy size={20} />}
                onClick={copy}
              >
                {copied ? t('about.copied') : t('about.copy')}
              </Button>
            )}
          </CopyButton>
          <Button size="lg" fullWidth={isMobile} onClick={onClose}>
            {t('close')}
          </Button>
        </Flex>
      </Stack>
    </Modal>
  );
};

export default AboutModal;
