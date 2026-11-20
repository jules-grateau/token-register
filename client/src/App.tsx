import {
  Badge,
  Card,
  Drawer,
  Input,
  MantineProvider,
  Menu,
  Modal,
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

// docs/design/colors.md, "Mapping Mantine". Same values as styles/variables.css.
const moutarde: MantineColorsTuple = [
  '#FDF7E4',
  '#F9EBC0',
  '#F6E2A8',
  '#F2D27C',
  '#F0B93A',
  '#E2A831',
  '#C48F1F',
  '#9C7016',
  '#6F500F',
  '#3A2F12',
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
// Warm dark neutrals: 0 text, 1 text 2, 4 border, 5 surface 2, 6 surface, 7 background, 8 bar.
const dark: MantineColorsTuple = [
  '#F6EFDC',
  '#B7AD93',
  '#7C7358',
  '#5A523F',
  '#3A3220',
  '#2A2418',
  '#211C12',
  '#16130C',
  '#0E0C07',
  '#0A0905',
];

const FONT_FAMILY = "'Manrope Variable', Manrope, system-ui, -apple-system, sans-serif";

const theme = createTheme({
  primaryColor: 'moutarde',
  primaryShade: { light: 5, dark: 4 },
  colors: { moutarde, red, green, dark },
  black: '#1F1A0F', // ink text on mustard (autoContrast)
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
    Modal: Modal.extend({
      defaultProps: { radius: 'lg' },
      classNames: {
        content: classes.modalContent,
        header: classes.modalHeader,
        title: classes.modalTitle,
        overlay: classes.modalOverlay,
      },
    }),
    Drawer: Drawer.extend({
      defaultProps: { radius: 'lg' },
      classNames: {
        content: classes.modalContent,
        header: classes.modalHeader,
        title: classes.modalTitle,
        overlay: classes.modalOverlay,
      },
    }),
    Menu: Menu.extend({ classNames: { dropdown: classes.popoverDropdown } }),
    Popover: Popover.extend({ classNames: { dropdown: classes.popoverDropdown } }),
    Input: Input.extend({ classNames: { wrapper: classes.inputWrapper } }),
  },
});

// "light" / "subtle" / "outline" variants of the primary color: mustard is never text on a light
// background (2.1:1), so their text and icons are ink in light and mustard in dark.
const cssVariablesResolver: CSSVariablesResolver = () => ({
  variables: {},
  light: {
    '--mantine-color-body': '#FBF5E6',
    '--mantine-color-text': '#1F1A0F',
    '--mantine-color-dimmed': '#5E5644',
    '--mantine-color-default': '#FFFFFF',
    '--mantine-color-default-hover': '#F4ECD6',
    '--mantine-color-default-color': '#1F1A0F',
    '--mantine-color-default-border': '#EADFC4',
    '--mantine-color-error': '#B91C1C',
    '--mantine-color-moutarde-light': '#F6E2A8',
    '--mantine-color-moutarde-light-hover': '#F2D27C',
    '--mantine-color-moutarde-light-color': '#1F1A0F',
    '--mantine-color-moutarde-outline': '#1F1A0F',
    '--mantine-color-moutarde-outline-hover': '#F4ECD6',
  },
  dark: {
    '--mantine-color-body': '#16130C',
    '--mantine-color-text': '#F6EFDC',
    '--mantine-color-dimmed': '#B7AD93',
    '--mantine-color-default': '#211C12',
    '--mantine-color-default-hover': '#2A2418',
    '--mantine-color-default-color': '#F6EFDC',
    '--mantine-color-default-border': '#3A3220',
    '--mantine-color-error': '#F87171',
    '--mantine-color-moutarde-light': '#3A2F12',
    '--mantine-color-moutarde-light-color': '#F0B93A',
    '--mantine-color-moutarde-outline': '#F0B93A',
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
