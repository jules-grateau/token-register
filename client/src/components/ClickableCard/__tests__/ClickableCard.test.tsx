import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ClickableCard from '../index';

describe('ClickableCard', () => {
  it('renders the title', () => {
    render(
      <ClickableCard title="Test Card" onClick={() => {}}>
        Content
      </ClickableCard>
    );
    expect(screen.getByText('Test Card')).toBeInTheDocument();
  });

  it('renders children', () => {
    render(
      <ClickableCard title="Card" onClick={() => {}}>
        <span>Extra Content</span>
      </ClickableCard>
    );
    expect(screen.getByText('Extra Content')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<ClickableCard title="Clickable" onClick={handleClick} />);
    fireEvent.click(screen.getByRole('button', { name: /clickable/i }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
