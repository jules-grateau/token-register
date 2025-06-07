import React from 'react';
import { render, screen } from '@testing-library/react';
import Loader from '../index';

describe('Loader', () => {
  it('renders the loader when isLoading is true', () => {
    render(<Loader isLoading={true} />);
    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });

  it('renders the loader with custom text', () => {
    render(<Loader isLoading={true} text="Loading data..." />);
    expect(screen.getByText('Loading data...')).toBeInTheDocument();
  });

  it('renders nothing when isLoading is false', () => {
    render(<Loader isLoading={false} />);
    expect(screen.queryByTestId('loading')).toBeNull();
  });
});
