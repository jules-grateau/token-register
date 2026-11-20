import { MantineProvider, createTheme, type CSSVariablesResolver } from '@mantine/core';
import { Bounce, ToastContainer } from 'react-toastify';
import { Register } from './components/Register';
import { useLayoutMode } from './hooks/useLayoutMode';

// docs/design/colors.md
const theme = createTheme({
  primaryColor: 'yellow',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  defaultRadius: 'md',
  autoContrast: true, // black text on light fills (yellow buttons, badges)
});

const cssVariablesResolver: CSSVariablesResolver = () => ({
  variables: {},
  light: {},
  dark: { '--mantine-color-dimmed': 'var(--mantine-color-dark-1)' }, // #B8B8B8, 4.5:1+
});

function App() {
  const mode = useLayoutMode();

  return (
    <MantineProvider
      theme={theme}
      cssVariablesResolver={cssVariablesResolver}
      defaultColorScheme="dark"
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
