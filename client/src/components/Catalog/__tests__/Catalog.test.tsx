import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import Catalog from '../index';
import { useSelector, useDispatch } from 'react-redux';
import { useGetCategoriesQuery, useGetProductsByCategoryQuery } from '../../../services/categories';
import { useGetProductsQuery } from '../../../services/product';
import { render } from '../../../utils/testUtils';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
  useDispatch: jest.fn(),
}));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));
jest.mock('../../../services/categories', () => ({
  useGetCategoriesQuery: jest.fn(),
  useGetProductsByCategoryQuery: jest.fn(),
}));
jest.mock('../../../services/product', () => ({
  useGetProductsQuery: jest.fn(),
}));

const mockDispatch = jest.fn();

const mockCategories = [
  { id: 1, name: 'Drinks' },
  { id: 2, name: 'Snacks' },
];
const mockProducts = [
  { id: 1, name: 'Cola', price: 2 },
  { id: 2, name: 'Chips', price: 3 },
];

describe('Catalog', () => {
  beforeEach(() => {
    (useDispatch as unknown as jest.Mock).mockReturnValue(mockDispatch);
    (useSelector as unknown as jest.Mock).mockImplementation((selector: any) => {
      if (selector.name === 'selectSelectedCategory') return null;
      return undefined;
    });
    (useGetCategoriesQuery as jest.Mock).mockReturnValue({
      isLoading: false,
      isError: false,
      data: mockCategories,
      currentData: mockCategories,
      isFetching: false,
    });
    (useGetProductsQuery as jest.Mock).mockReturnValue({
      isFetching: false,
      isError: false,
      currentData: mockProducts,
    });
    (useGetProductsByCategoryQuery as jest.Mock).mockReturnValue({
      isFetching: false,
      isError: false,
      currentData: mockProducts,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders categories', () => {
    render(<Catalog />);
    expect(screen.getByText('Drinks')).toBeInTheDocument();
    expect(screen.getByText('Snacks')).toBeInTheDocument();
  });

  it('renders products when a category is selected', () => {
    (useSelector as unknown as jest.Mock).mockImplementation((selector: any) => {
      if (selector.name === 'selectSelectedCategory') return 1;
      return undefined;
    });
    render(<Catalog />);
    expect(screen.getByText('Cola')).toBeInTheDocument();
    expect(screen.getByText('Chips')).toBeInTheDocument();
  });

  it('shows loader when loading', () => {
    (useGetCategoriesQuery as jest.Mock).mockReturnValue({
      isLoading: true,
      isError: false,
      data: undefined,
      currentData: undefined,
      isFetching: true,
    });
    render(<Catalog />);
    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });

  it('handles category selection', () => {
    render(<Catalog />);
    fireEvent.click(screen.getByText('Drinks'));
    expect(mockDispatch).toHaveBeenCalled();
  });

  it('handles add to cart from product', () => {
    (useSelector as unknown as jest.Mock).mockImplementation((selector: any) => {
      if (selector.name === 'selectSelectedCategory') return 1;
      return undefined;
    });
    render(<Catalog />);

    fireEvent.click(screen.getByText('Cola'));
    expect(mockDispatch).toHaveBeenCalled();
  });

  it('shows error if categories query fails', () => {
    (useGetCategoriesQuery as jest.Mock).mockReturnValue({
      isLoading: false,
      isError: true,
      data: undefined,
      currentData: undefined,
      isFetching: false,
    });
    render(<Catalog />);
    expect(screen.getByText('error_loading_categories')).toBeInTheDocument();
  });

  it('shows error if products query fails', () => {
    (useSelector as unknown as jest.Mock).mockImplementation((selector: any) => {
      if (selector.name === 'selectSelectedCategory') return 1;
      return undefined;
    });
    (useGetProductsByCategoryQuery as jest.Mock).mockReturnValue({
      isFetching: false,
      isError: true,
      currentData: undefined,
    });
    render(<Catalog />);
    expect(screen.getByText('error_loading_products')).toBeInTheDocument();
  });
});
