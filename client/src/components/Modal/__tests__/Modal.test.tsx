import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Modal from '../index';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('Modal', () => {
  const onClose = jest.fn();

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('does not render when isOpen is false', () => {
    render(
      <Modal isOpen={false} onClose={onClose} title="Hidden">
        <div>Should not render</div>
      </Modal>
    );
    expect(screen.queryByText('Hidden')).not.toBeInTheDocument();
    expect(screen.queryByText('Should not render')).not.toBeInTheDocument();
  });

  it('renders title and children when open', () => {
    render(
      <Modal isOpen={true} onClose={onClose} title="My Modal">
        <div>Modal Content</div>
      </Modal>
    );
    expect(screen.getByText('My Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal Content')).toBeInTheDocument();
  });

  it('renders custom footer if provided', () => {
    render(
      <Modal isOpen={true} onClose={onClose} title="With Footer" footer={<div>Custom Footer</div>}>
        <div>Body</div>
      </Modal>
    );
    expect(screen.getByText('Custom Footer')).toBeInTheDocument();
  });

  it('renders default close button if no footer', () => {
    render(
      <Modal isOpen={true} onClose={onClose} title="No Footer">
        <div>Body</div>
      </Modal>
    );
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
  });

  it('calls onClose when overlay is clicked', () => {
    render(
      <Modal isOpen={true} onClose={onClose} title="Overlay">
        <div>Body</div>
      </Modal>
    );
    fireEvent.click(screen.getByRole('dialog'));
    expect(onClose).toHaveBeenCalled();
  });

  it('does not call onClose when modal content is clicked', () => {
    render(
      <Modal isOpen={true} onClose={onClose} title="Content">
        <div>Body</div>
      </Modal>
    );
    fireEvent.click(screen.getByText('Body'));
    expect(onClose).not.toHaveBeenCalled();
  });
});
