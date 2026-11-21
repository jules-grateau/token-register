import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Drawer,
  Input,
  MantineProvider,
  Menu,
  Modal,
  Pagination,
  Paper,
  Popover,
  createTheme,
  localStorageColorSchemeManager,
  type CSSVariablesResolver,
  type MantineColorsTuple,
} from '@mantine/core';
import { Bounce, ToastContainer } from 'react-toastify';
import { Register } from './components/Register';
import { useLayoutMode } from './hooks/useLayoutMode';
import classes from './styles/theme.module.css';
import { actionIconVars, buttonVars, paginationVars } from './styles/primaryContrast';

// docs/design/colors.md, "Mapping Mantine". Same values as styles/variables.css.
// Ink primary (D-051): shade 8 in light (#26241F), shade 1 in dark (#F2EFE8).
const encre: MantineColorsTuple = [
  '#F7F6F3',
  '#F2EFE8',
  '#E7E4DC',
  '#CFCCC4',
  '#A8A49C',
  '#85817A',
  '#57534E',
  '#3A3834',
  '#26241F',
  '#1C1B19',
];
const red: MantineColorsTuple = [
  '#FEF2F2',
  '#FBE4E4',
  '#FBCACA',
  '#F9A8A8',
  '#F87171',
  '#B91C1C',
  '#991B1B',
  '#7F1D1D',
  '#5F1515',
  '#3A0B0B',
];
const green: MantineColorsTuple = [
  '#F0FDF4',
  '#DDF3E2',
  '#BBE8C8',
  '#8FD9A8',
  '#4ADE80',
  '#166534',
  '#14532D',
  '#0F3D22',
  '#0B2A17',
  '#071A0E',
];
// Graphite dark neutrals: 0 text, 1 text 2, 2 border strong, 4 border, 5 surface 2, 6 surface,
// 7 background, 8 bar.
const dark: MantineColorsTuple = [
  '#F2EFE8',
  '#B3AFA6',
  '#7A766E',
  '#5A5751',
  '#3A3834',
  '#282725',
  '#1E1D1B',
  '#141413',
  '#0C0C0B',
  '#080807',
];

const FONT_FAMILY = "'Manrope Variable', Manrope, system-ui, -apple-system, sans-serif";

const theme = createTheme({
  primaryColor: 'encre',
  primaryShade: { light: 8, dark: 1 },
  colors: { encre, red, green, dark },
  black: '#1C1B19', // ink text on the light primary of the dark scheme (autoContrast)
  white: '#FFFFFF',
  autoContrast: true,
  fontFamily: FONT_FAMILY,
  headings: { fontFamily: FONT_FAMILY, fontWeight: '800' },
  defaultRadius: 'md',
  radius: { xs: '8px', sm: '12px', md: '14px', lg: '20px', xl: '999px' },
  components: {
    Paper: Paper.extend({ classNames: { root: classes.paper } }),
    Card: Card.extend({ defaultProps: { radius: 'lg' }, classNames: { root: classes.card } }),
    Badge: Badge.extend({ defaultProps: { radius: 'xl' } }),
    // Filled primary: --color-on-primary text in both schemes (styles/primaryContrast.ts).
    Button: Button.extend({ vars: buttonVars }),
    ActionIcon: ActionIcon.extend({ vars: actionIconVars }),
    Pagination: Pagination.extend({ vars: paginationVars }),
    Modal: Modal.extend({
      defaultProps: { radius: 'lg' },
      classNames: {
        content: classes.modalContent,
        header: classes.modalHeader,
        title: classes.modalTitle,
        overlay: classes.modalOverlay,
        close: classes.modalClose,
      },
    }),
    Drawer: Drawer.extend({
      defaultProps: { radius: 'lg' },
      classNames: {
        content: classes.modalContent,
        header: classes.modalHeader,
        title: classes.modalTitle,
        overlay: classes.modalOverlay,
        close: classes.modalClose,
      },
    }),
    Menu: Menu.extend({ classNames: { dropdown: classes.popoverDropdown } }),
    // Also used by Menu and Select / Combobox. `size`: never taller than the room left in the
    // window (8 px margin), the dropdown scrolls instead (theme.module.css); phone in landscape
    // has under 300 px of height (2.2.1). No change when the dropdown fits.
    Popover: Popover.extend({
      defaultProps: { middlewares: { flip: true, shift: true, size: { padding: 8 } } },
      classNames: { dropdown: classes.popoverDropdown },
    }),
    Input: Input.extend({ classNames: { wrapper: classes.inputWrapper } }),
  },
});

// "light" / "subtle" / "outline" variants of the primary color: neutral tint (primary-tint) with
// ink text, never olive (olive is for the icon tiles and the logo only, D-051).
const cssVariablesResolver: CSSVariablesResolver = () => ({
  variables: {},
  light: {
    '--mantine-color-body': '#F5F4F1',
    '--mantine-color-text': '#1C1B19',
    '--mantine-color-dimmed': '#57534E',
    '--mantine-color-default': '#FFFFFF',
    '--mantine-color-default-hover': '#ECEAE5',
    '--mantine-color-default-color': '#1C1B19',
    '--mantine-color-default-border': '#DDDAD3',
    '--mantine-color-error': '#B91C1C',
    '--mantine-color-encre-light': '#E7E4DC',
    '--mantine-color-encre-light-hover': '#DDDAD3',
    '--mantine-color-encre-light-color': '#1C1B19',
    '--mantine-color-encre-outline': '#26241F',
    '--mantine-color-encre-outline-hover': '#ECEAE5',
  },
  dark: {
    '--mantine-color-body': '#141413',
    '--mantine-color-text': '#F2EFE8',
    '--mantine-color-dimmed': '#B3AFA6',
    '--mantine-color-default': '#1E1D1B',
    '--mantine-color-default-hover': '#282725',
    '--mantine-color-default-color': '#F2EFE8',
    '--mantine-color-default-border': '#3A3834',
    '--mantine-color-error': '#F87171',
    '--mantine-color-encre-light': '#2E2D2A',
    '--mantine-color-encre-light-hover': '#3A3834',
    '--mantine-color-encre-light-color': '#F2EFE8',
    '--mantine-color-encre-outline': '#F2EFE8',
    '--mantine-color-encre-outline-hover': '#282725',
  },
});

// D-041: follows the device by default; the user's choice is remembered on the device.
const colorSchemeManager = localStorageColorSchemeManager({
  key: 'caisse-claire-color-scheme',
});

function App() {
  const mode = useLayoutMode();

  return (
    <MantineProvider
      theme={theme}
      cssVariablesResolver={cssVariablesResolver}
      colorSchemeManager={colorSchemeManager}
      defaultColorScheme="auto"
    >
      <div className="app-container">
        {/* docs/design/components.md, "Toasts" */}
        <ToastContainer
          position={mode === 'phone-landscape' ? 'bottom-left' : 'bottom-center'}
          autoClose={3000}
          limit={3}
          hideProgressBar={true}
          newestOnTop={false}
          closeOnClick={true}
          rtl={false}
          theme="colored"
          transition={Bounce}
        />
        <Register />
      </div>
    </MantineProvider>
  );
}

export default App;
