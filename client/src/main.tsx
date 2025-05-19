import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { Provider } from 'react-redux'
import { store } from './redux/store.ts'
import ErrorBoundary from './components/ErrorBoundary/index.tsx'

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <StrictMode>
      <Provider store={store}>
        <App />
      </Provider>
    </StrictMode>
  </ErrorBoundary>,
)
