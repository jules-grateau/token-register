import { screen } from '@testing-library/react';
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
