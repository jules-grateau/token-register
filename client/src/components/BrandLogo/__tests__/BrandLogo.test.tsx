import React from 'react';
import { render, screen } from '@testing-library/react';
import BrandLogo from '../index';

describe('BrandLogo', () => {
  it('is decorative without a label', () => {
    render(<BrandLogo size={28} />);
    const logo = screen.getByTestId('brand-logo');
    expect(logo).toHaveAttribute('aria-hidden', 'true');
    expect(logo).not.toHaveAttribute('role');
    expect(logo).toHaveAttribute('width', '28');
  });

  it('carries its label as an image when given one', () => {
    render(<BrandLogo size={24} label="Caisse Claire" />);
    expect(screen.getByRole('img', { name: 'Caisse Claire' })).toHaveAttribute('height', '24');
  });

  it('follows the color scheme through the logo tokens (D-051)', () => {
    render(<BrandLogo size={64} />);
    const logo = screen.getByTestId('brand-logo');
    expect(logo.querySelector('rect')).toHaveAttribute('fill', 'var(--color-logo)');
    expect(logo.querySelector('path')).toHaveAttribute('fill', 'var(--color-logo-glyph)');
  });
});
