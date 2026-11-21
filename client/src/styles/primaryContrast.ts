/**
 * Text color of the filled primary controls (DS-1 of PR #43).
 *
 * Mantine's `autoContrast` picks the text color from the primary shade of the light scheme only:
 * on the cream primary of the dark scheme (#F2EFE8) it would keep white text (1.2:1). These vars
 * resolvers force `--color-on-primary` (white in light, ink in dark) on the filled primary
 * Button / ActionIcon and the active Pagination control (the SegmentedControl label already uses
 * it, ColorSchemeControl.module.css).
 * Other colors (red "destructive", gray, green) keep Mantine's own contrast.
 */
const PRIMARY_COLOR = 'encre';
export const ON_PRIMARY = 'var(--color-on-primary)';

/** No color (= theme primary), `encre` or one of its shades (`encre.8`). */
export function isPrimaryColor(color: string | undefined): boolean {
  return color === undefined || color === PRIMARY_COLOR || color.startsWith(`${PRIMARY_COLOR}.`);
}

/** Filled is Mantine's default variant for Button and ActionIcon. */
function isFilledPrimary(props: { color?: string; variant?: string }): boolean {
  return (props.variant === undefined || props.variant === 'filled') && isPrimaryColor(props.color);
}

export const buttonVars = (_theme: unknown, props: { color?: string; variant?: string }) => ({
  root: isFilledPrimary(props) ? { '--button-color': ON_PRIMARY } : {},
});

export const actionIconVars = (_theme: unknown, props: { color?: string; variant?: string }) => ({
  root: isFilledPrimary(props) ? { '--ai-color': ON_PRIMARY } : {},
});

export const paginationVars = (_theme: unknown, props: { color?: string }) => ({
  root: isPrimaryColor(props.color) ? { '--pagination-active-color': ON_PRIMARY } : {},
});
