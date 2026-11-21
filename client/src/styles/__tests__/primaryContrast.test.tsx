import React from 'react';
import { render, screen } from '@testing-library/react';
import { ActionIcon, Button, MantineProvider, createTheme } from '@mantine/core';
import { actionIconVars, buttonVars, isPrimaryColor, ON_PRIMARY } from '../primaryContrast';

const theme = createTheme({
  primaryColor: 'blue',
  autoContrast: true,
  components: {
    Button: Button.extend({ vars: buttonVars }),
    ActionIcon: ActionIcon.extend({ vars: actionIconVars }),
  },
});

const renderDark = (ui: React.ReactElement) =>
  render(
    <MantineProvider theme={theme} forceColorScheme="dark">
      {ui}
    </MantineProvider>
  );

describe('primaryContrast (DS-1 of PR #43)', () => {
  it('recognizes the primary color', () => {
    expect(isPrimaryColor(undefined)).toBe(true);
    expect(isPrimaryColor('encre')).toBe(true);
    expect(isPrimaryColor('encre.8')).toBe(true);
    expect(isPrimaryColor('red')).toBe(false);
    expect(isPrimaryColor('gray')).toBe(false);
  });

  it('filled primary Button and ActionIcon: text in --color-on-primary', () => {
    renderDark(
      <>
        <Button>Valider</Button>
        <Button variant="filled" color="encre">
          Choisi
        </Button>
        <ActionIcon aria-label="Ajouter">+</ActionIcon>
      </>
    );
    expect(
      screen.getByRole('button', { name: 'Valider' }).style.getPropertyValue('--button-color')
    ).toBe(ON_PRIMARY);
    expect(
      screen.getByRole('button', { name: 'Choisi' }).style.getPropertyValue('--button-color')
    ).toBe(ON_PRIMARY);
    expect(
      screen.getByRole('button', { name: 'Ajouter' }).style.getPropertyValue('--ai-color')
    ).toBe(ON_PRIMARY);
  });

  it('leaves red (destructive), default and light buttons to Mantine', () => {
    renderDark(
      <>
        <Button color="red">Supprimer</Button>
        <Button variant="default">Annuler</Button>
        <Button variant="light">Modifier</Button>
      </>
    );
    for (const name of ['Supprimer', 'Annuler', 'Modifier']) {
      expect(
        screen.getByRole('button', { name }).style.getPropertyValue('--button-color')
      ).not.toBe(ON_PRIMARY);
    }
  });
});
