import type { ReactNode } from 'react';
import { screen, fireEvent, render as rtlRender } from '@testing-library/react';
import { MantineProvider, useMantineColorScheme } from '@mantine/core';
import ColorSchemeControl from '../index';

// Same default as App.tsx: follow the device (D-041).
const render = (ui: ReactNode) =>
  rtlRender(
    <MantineProvider defaultColorScheme="auto">
      <>{ui}</>
    </MantineProvider>
  );

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const CurrentScheme = () => {
  const { colorScheme } = useMantineColorScheme();
  return <span data-testid="current-scheme">{colorScheme}</span>;
};

describe('ColorSchemeControl (D-041)', () => {
  beforeEach(() => localStorage.clear());

  it('offers Auto, Light and Dark, with Auto selected by default', () => {
    render(
      <>
        <ColorSchemeControl />
        <CurrentScheme />
      </>
    );

    expect(screen.getByText('theme.label')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'theme.auto' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'theme.light' })).not.toBeChecked();
    expect(screen.getByRole('radio', { name: 'theme.dark' })).not.toBeChecked();
  });

  it('switches the color scheme immediately and remembers it on the device', () => {
    render(
      <>
        <ColorSchemeControl />
        <CurrentScheme />
      </>
    );

    fireEvent.click(screen.getByRole('radio', { name: 'theme.dark' }));

    expect(screen.getByTestId('current-scheme')).toHaveTextContent('dark');
    expect(screen.getByRole('radio', { name: 'theme.dark' })).toBeChecked();
    expect(Object.values({ ...localStorage })).toContain('dark');
  });
});
