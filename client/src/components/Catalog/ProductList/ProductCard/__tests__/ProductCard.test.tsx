import { screen, fireEvent } from '@testing-library/react';
import ProductCard from '../index';
import { render } from '../../../../../utils/testUtils';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { count?: number }) =>
      opts?.count !== undefined ? `${key} (${opts.count})` : key,
  }),
}));

const product = { id: 1, name: 'Retour Eco-cup', price: -100, categoryId: 4 };

describe('ProductCard price', () => {
  afterEach(() => {
    window.APP_CONFIG = undefined;
  });

  it('shows tokens with the translated label by default', () => {
    render(<ProductCard product={{ ...product, price: 3 }} onClick={jest.fn()} />);
    expect(screen.getByText('3 tokens (3)')).toBeInTheDocument();
  });

  it('shows euros in French format on an EUR instance', () => {
    window.APP_CONFIG = { VITE_CURRENCY: 'EUR' };
    render(<ProductCard product={product} onClick={jest.fn()} />);
    expect(screen.getByText(/^-1,00\s€$/)).toBeInTheDocument();
  });
});

describe('ProductCard structure and edit mode', () => {
  it('has no button nested in another button, in edit mode too', () => {
    const { container } = render(
      <ProductCard product={product} onClick={jest.fn()} isEditMode onEdit={jest.fn()} />
    );
    expect(container.querySelectorAll('button button')).toHaveLength(0);
    expect(screen.getAllByRole('button')).toHaveLength(3);
  });

  it('adds to the cart when touched outside edit mode', () => {
    const onClick = jest.fn();
    const onEdit = jest.fn();
    render(<ProductCard product={product} onClick={onClick} onEdit={onEdit} />);
    fireEvent.click(screen.getByRole('button', { name: 'product_card.add' }));
    expect(onClick).toHaveBeenCalled();
    expect(onEdit).not.toHaveBeenCalled();
  });

  it('opens the edit form when the card is touched in edit mode (D-022)', () => {
    const onClick = jest.fn();
    const onEdit = jest.fn();
    render(<ProductCard product={product} onClick={onClick} isEditMode onEdit={onEdit} />);
    fireEvent.click(screen.getByText('Retour Eco-cup'));
    expect(onEdit).toHaveBeenCalledWith(product);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('keeps the edit and delete buttons', () => {
    const onEdit = jest.fn();
    const onDelete = jest.fn();
    render(
      <ProductCard
        product={product}
        onClick={jest.fn()}
        isEditMode
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'actions.edit' }));
    fireEvent.click(screen.getByRole('button', { name: 'delete' }));
    expect(onEdit).toHaveBeenCalledWith(product);
    expect(onDelete).toHaveBeenCalledWith(product);
  });

  it('never cuts a long name (D-021)', () => {
    const name = 'Bière pression 25cl / 50cl avec un nom vraiment très long';
    render(<ProductCard product={{ ...product, name }} onClick={jest.fn()} />);
    const text = screen.getByText(name);
    expect(text).not.toHaveAttribute('data-line-clamp');
    expect(text).not.toHaveAttribute('data-truncate');
  });
});
