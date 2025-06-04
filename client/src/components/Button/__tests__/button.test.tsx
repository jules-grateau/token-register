import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Button from '../index';

describe('Button', () => {
  it('renders children', () => {
    render(<Button onClick={() => {}}>My Button</Button>);
    expect(screen.getByRole('button', { name: /my button/i })).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click Me</Button>);
    fireEvent.click(screen.getByRole('button', { name: /click me/i }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies the correct color class', () => {
    render(
      <Button onClick={() => {}} color="danger">
        Danger
      </Button>
    );
    const button = screen.getByRole('button', { name: /danger/i });
    expect(button.className).toMatch(/button--danger/);
  });

  it('applies fullHeight and fullWidth classes', () => {
    render(
      <Button onClick={() => {}} fullHeight fullWidth>
        Full
      </Button>
    );
    const button = screen.getByRole('button', { name: /full/i });
    expect(button.className).toMatch(/button--full-height/);
    expect(button.className).toMatch(/button--full-width/);
  });
});
