import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/manrope';
import '@mantine/core/styles.css';
import './index.css';
import App from './App';
import { Provider } from 'react-redux';
import { store } from './redux/store';
import ErrorBoundary from './components/ErrorBoundary';
import { buildDocumentTitle, getClientName } from './config/client';
import './i18n';

// D-040: "Asso · Caisse Claire" in the browser tab, "Caisse Claire" without a client name.
document.title = buildDocumentTitle(getClientName());

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <StrictMode>
      <Provider store={store}>
        <App />
      </Provider>
    </StrictMode>
  </ErrorBoundary>
);
