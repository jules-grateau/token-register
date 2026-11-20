import React from 'react';
import {
  Center,
  SegmentedControl,
  Stack,
  Text,
  useMantineColorScheme,
  type MantineColorScheme,
} from '@mantine/core';
import { IconDeviceDesktop, IconMoon, IconSun } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import classes from './ColorSchemeControl.module.css';

const SCHEMES: { value: MantineColorScheme; icon: typeof IconSun }[] = [
  { value: 'auto', icon: IconDeviceDesktop },
  { value: 'light', icon: IconSun },
  { value: 'dark', icon: IconMoon },
];

const isColorScheme = (value: string): value is MantineColorScheme =>
  SCHEMES.some((scheme) => scheme.value === value);

// D-041: "Apparence" in the settings menu, Auto / Clair / Sombre. Mantine stores the choice
// on the device (localStorage); "Auto" follows prefers-color-scheme.
// docs/design/components.md, "Bascule clair/sombre".
const ColorSchemeControl: React.FC = () => {
  const { t } = useTranslation();
  const { colorScheme, setColorScheme } = useMantineColorScheme();

  return (
    <Stack gap={6} px="sm" py="xs">
      <Text size="lg" id="color-scheme-label">
        {t('theme.label')}
      </Text>
      <SegmentedControl
        fullWidth
        aria-labelledby="color-scheme-label"
        radius="md"
        color="moutarde"
        classNames={{ root: classes.root, label: classes.label }}
        value={colorScheme}
        onChange={(value) => {
          if (isColorScheme(value)) setColorScheme(value);
        }}
        data={SCHEMES.map(({ value, icon: Icon }) => ({
          value,
          label: (
            <Center style={{ gap: 6 }}>
              <Icon size={20} aria-hidden="true" />
              <span>{t(`theme.${value}`)}</span>
            </Center>
          ),
        }))}
      />
    </Stack>
  );
};

export default ColorSchemeControl;
