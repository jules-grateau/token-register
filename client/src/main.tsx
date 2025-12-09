import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@mantine/core/styles.css';
import './index.css';
import App from './App';
import { Provider } from 'react-redux';
import { store } from './redux/store';
import ErrorBoundary from './components/ErrorBoundary';
import './i18n';

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <StrictMode>
      <Provider store={store}>
        <App />
      </Provider>
    </StrictMode>
  </ErrorBoundary>
);
