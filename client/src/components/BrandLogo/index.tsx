import React from 'react';

interface BrandLogoProps {
  /** Width and height, in px. */
  size: number;
  /** Accessible name; missing = decorative (aria-hidden). */
  label?: string;
  className?: string;
}

/**
 * Caisse Claire logo (docs/design/README.md, "Logo"): ink ticket on an olive tile (D-051).
 * Inline SVG so the tile and the glyph follow the color scheme (--color-logo, --color-logo-glyph);
 * `assets/brand/logo.svg` is the same drawing with the light values, for use outside the app.
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({ size, label, className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    className={className}
    role={label ? 'img' : undefined}
    aria-label={label}
    aria-hidden={label ? undefined : true}
    focusable="false"
    data-testid="brand-logo"
  >
    <rect width="24" height="24" rx="7" fill="var(--color-logo)" />
    <path d="M7 5h10v14l-2-1.5-3 1.5-3-1.5-2 1.5z" fill="var(--color-logo-glyph)" />
    <path
      d="M9.5 9h5M9.5 12.5h3"
      stroke="var(--color-logo)"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

export default BrandLogo;
