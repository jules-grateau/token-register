import { screen } from '@testing-library/react';
import { useSelector } from 'react-redux';
import ProductList from '../index';
import { render } from '../../../../utils/testUtils';

jest.mock('react-redux', () => ({ useSelector: jest.fn() }));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { count?: number }) =>
      opts?.count !== undefined ? `${key} (${opts.count})` : key,
  }),
}));

const beer = { id: 1, name: 'Bière', price: 3, categoryId: 1 };
const water = { id: 2, name: 'Eau', price: 1, categoryId: 1 };

describe('ProductList quantity badge (D-048)', () => {
  it('shows the whole quantity of the cart line, discount included', () => {
    (useSelector as unknown as jest.Mock).mockReturnValue([
      { product: beer, quantity: 4, discountedAmount: 2 },
    ]);
    render(
      <ProductList
        isLoading={false}
        isError={false}
        products={[beer, water]}
        onAddToCart={jest.fn()}
      />
    );

    const badges = screen.getAllByTestId('product-card-badge');
    expect(badges).toHaveLength(1);
    expect(badges[0]).toHaveTextContent('4');
  });

  it('shows no badge for a line brought down to 0', () => {
    (useSelector as unknown as jest.Mock).mockReturnValue([
      { product: beer, quantity: 0, discountedAmount: 0 },
    ]);
    render(
      <ProductList isLoading={false} isError={false} products={[beer]} onAddToCart={jest.fn()} />
    );
    expect(screen.queryByTestId('product-card-badge')).not.toBeInTheDocument();
  });
});
