import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ConfirmationModal from '../index';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('ConfirmationModal', () => {
  const onClose = jest.fn();
  const onConfirm = jest.fn();

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders title and children when open', () => {
    render(
      <ConfirmationModal isOpen={true} onClose={onClose} onConfirm={onConfirm} title="Test Title">
        <div>Modal Content</div>
      </ConfirmationModal>
    );
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Modal Content')).toBeInTheDocument();
  });

  it('does not render when not open', () => {
    render(
      <ConfirmationModal isOpen={false} onClose={onClose} onConfirm={onConfirm} title="Hidden">
        <div>Should not be visible</div>
      </ConfirmationModal>
    );
    expect(screen.queryByText('Hidden')).not.toBeInTheDocument();
    expect(screen.queryByText('Should not be visible')).not.toBeInTheDocument();
  });

  it('calls onConfirm when confirm button is clicked', () => {
    render(
      <ConfirmationModal isOpen={true} onClose={onClose} onConfirm={onConfirm} title="Confirm">
        <div>Content</div>
      </ConfirmationModal>
    );
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }));
    expect(onConfirm).toHaveBeenCalled();
  });

  it('calls onClose when cancel button is clicked', () => {
    render(
      <ConfirmationModal isOpen={true} onClose={onClose} onConfirm={onConfirm} title="Cancel">
        <div>Content</div>
      </ConfirmationModal>
    );
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it('renders custom button texts', () => {
    render(
      <ConfirmationModal
        isOpen={true}
        onClose={onClose}
        onConfirm={onConfirm}
        title="Custom"
        confirmButtonText="Yes"
        cancelButtonText="No"
      >
        <div>Content</div>
      </ConfirmationModal>
    );
    expect(screen.getByRole('button', { name: /yes/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /no/i })).toBeInTheDocument();
  });

  it('renders extraFooter if provided', () => {
    render(
      <ConfirmationModal
        isOpen={true}
        onClose={onClose}
        onConfirm={onConfirm}
        title="Footer"
        extraFooter={<div>Extra Footer</div>}
      >
        <div>Content</div>
      </ConfirmationModal>
    );
    expect(screen.getByText('Extra Footer')).toBeInTheDocument();
  });
});
