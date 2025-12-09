import { MantineProvider, createTheme } from '@mantine/core';
import { Bounce, ToastContainer } from 'react-toastify';
import { Register } from './components/Register';

const theme = createTheme({
  primaryColor: 'yellow',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  defaultRadius: 'md',
});

function App() {
  return (
    <MantineProvider theme={theme} defaultColorScheme="light">
      <div className="app-container">
        <ToastContainer
          position="top-center"
          autoClose={5000}
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
