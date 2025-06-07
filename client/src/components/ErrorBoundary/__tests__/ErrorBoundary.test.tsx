import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorBoundary from '../index';

jest.mock('react-i18next', () => ({
  withTranslation: () => (Component: any) => (props: any) => (
    <Component {...props} t={(key: string) => key} />
  ),
}));

describe('ErrorBoundary', () => {
  const ThrowError = () => {
    throw new Error('Test error');
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <div>Safe Child</div>
      </ErrorBoundary>
    );
    expect(screen.getByText('Safe Child')).toBeInTheDocument();
  });

  it('renders fallback UI when child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('oops_error')).toBeInTheDocument();
    expect(screen.getByText('error_message')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /refresh_page/i })).toBeInTheDocument();
  });

  it('calls the reload function when refresh button is clicked', () => {
    const mockReload = jest.fn();
    render(
      <ErrorBoundary onReload={mockReload}>
        <ThrowError />
      </ErrorBoundary>
    );
    fireEvent.click(screen.getByRole('button', { name: /refresh_page/i }));
    expect(mockReload).toHaveBeenCalled();
  });
});
