import React from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import styles from './ErrorBoundary.module.css';
import { withTranslation } from 'react-i18next';
import type { WithTranslation } from 'react-i18next';

interface Props extends WithTranslation {
  children?: ReactNode;
  onReload?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  static defaultProps = {
    onReload: () => window.location.reload(),
  };

  public static getDerivedStateFromError(error: Error): Pick<State, 'hasError' | 'error'> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleRefresh = () => {
    this.props.onReload?.();
  };

  render() {
    const { t } = this.props;

    if (this.state.hasError) {
      return (
        <div className={styles.errorBoundaryContainer} role="alert">
          <div className={styles.errorContent}>
            <h1 className={styles.errorTitle}>{t('oops_error')}</h1>
            <p className={styles.errorMessage}>{t('error_message')}</p>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className={styles.errorDetails}>
                <summary>Error Details (Development Only)</summary>
                <pre>
                  {this.state.error.toString()}
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </pre>
              </div>
            )}
            <button className={styles.refreshButton} onClick={this.handleRefresh}>
              {t('refresh_page')}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default withTranslation()(ErrorBoundary);
