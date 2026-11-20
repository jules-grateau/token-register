import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import Catalog from '../index';
import { useSelector, useDispatch } from 'react-redux';
import { useGetCategoriesQuery, useGetProductsByCategoryQuery } from '../../../services/categories';
import { useGetProductsQuery } from '../../../services/product';
import { render } from '../../../utils/testUtils';
import { resetLayoutMode, setLayoutMode } from '../../../test/layoutMode';
import { NARROW_TABLET_QUERY } from '../index';

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
  useCreateCategoryMutation: jest.fn(() => [jest.fn(), {}]),
  useUpdateCategoryMutation: jest.fn(() => [jest.fn(), {}]),
  useDeleteCategoryMutation: jest.fn(() => [jest.fn(), {}]),
}));
jest.mock('../../../services/product', () => ({
  useGetProductsQuery: jest.fn(),
  useCreateProductMutation: jest.fn(() => [jest.fn(), {}]),
  useUpdateProductMutation: jest.fn(() => [jest.fn(), {}]),
  useDeleteProductMutation: jest.fn(() => [jest.fn(), {}]),
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
      if (selector.name === 'selectCartItems') return [];
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
      if (selector.name === 'selectCartItems') return [];
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
      if (selector.name === 'selectCartItems') return [];
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
      if (selector.name === 'selectCartItems') return [];
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

describe('Catalog layout per mode', () => {
  const selectWith = (selected: number, isEditMode: boolean) =>
    (useSelector as unknown as jest.Mock).mockImplementation((selector: any) => {
      if (selector.name === 'selectSelectedCategory') return selected;
      if (selector.name === 'selectCartItems') return [];
      if (selector.name === 'selectIsEditMode') return isEditMode;
      return undefined;
    });

  beforeEach(() => {
    (useDispatch as unknown as jest.Mock).mockReturnValue(mockDispatch);
    (useGetCategoriesQuery as jest.Mock).mockReturnValue({
      isLoading: false,
      isError: false,
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
    resetLayoutMode();
    jest.clearAllMocks();
  });

  it('shows the categories as a horizontal row of tabs on a phone in portrait', () => {
    setLayoutMode('phone-portrait');
    selectWith(1, false);
    render(<Catalog />);
    expect(screen.getByRole('tablist')).toHaveAttribute('aria-orientation', 'horizontal');
    expect(screen.getByRole('tab', { name: 'Drinks' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toBeInTheDocument();
  });

  it.each([
    ['phone-portrait', 'horizontal'],
    ['tablet', 'vertical'],
  ] as const)(
    'shows a category icon before the name, the name only without icon (D-047): %s',
    (mode, orientation) => {
      setLayoutMode(mode);
      (useGetCategoriesQuery as jest.Mock).mockReturnValue({
        isLoading: false,
        isError: false,
        currentData: [
          { id: 1, name: 'Drinks', icon: 'beer' },
          { id: 2, name: 'Food', icon: null },
        ],
        isFetching: false,
      });
      selectWith(1, false);
      render(<Catalog />);
      expect(screen.getByRole('tablist')).toHaveAttribute('aria-orientation', orientation);
      const drinks = screen.getByRole('tab', { name: 'Drinks' });
      const food = screen.getByRole('tab', { name: 'Food' });
      expect(drinks.querySelector('svg.tabler-icon-beer')).not.toBeNull();
      expect(food.querySelector('svg')).toBeNull();
      expect(food).not.toHaveTextContent(/^F$/);
    }
  );

  it('keeps the vertical column of categories on a wide tablet', () => {
    selectWith(1, false);
    render(<Catalog />);
    expect(screen.getByRole('tablist')).toHaveAttribute('aria-orientation', 'vertical');
  });

  it('column (D-051): the selected line is flagged for the CSS, no inline fill, text weight 800', () => {
    selectWith(1, false);
    render(<Catalog />);
    const drinks = screen.getByRole('tab', { name: 'Drinks' });
    const all = screen.getByRole('tab', { name: 'all_categories' });
    expect(drinks).toHaveAttribute('data-active');
    expect(all).not.toHaveAttribute('data-active');
    // Surface 2 + ink accent come from Catalog.module.css, not from an inline background.
    expect(drinks.querySelector('[style*="background"]')).toBeNull();
    expect(screen.getByText('Drinks')).toHaveStyle({ fontWeight: '800' });
    expect(screen.getByText('all_categories')).toHaveStyle({ fontWeight: '700' });
  });

  it('uses the row of tabs on a tablet narrower than 768 px', () => {
    setLayoutMode('tablet', [NARROW_TABLET_QUERY]);
    selectWith(1, false);
    render(<Catalog />);
    expect(screen.getByRole('tablist')).toHaveAttribute('aria-orientation', 'horizontal');
  });

  it('edit mode on a phone in portrait: toolbar for the selected category', () => {
    setLayoutMode('phone-portrait');
    selectWith(1, true);
    render(<Catalog />);
    const toolbar = screen.getByTestId('category-toolbar');
    expect(toolbar).toHaveTextContent('Drinks');
    expect(screen.getByRole('button', { name: 'category_management.new' })).toBeInTheDocument();
  });

  it('edit mode on a phone in portrait: no toolbar on "all categories"', () => {
    setLayoutMode('phone-portrait');
    selectWith(0, true);
    render(<Catalog />);
    expect(screen.queryByTestId('category-toolbar')).not.toBeInTheDocument();
  });

  it('edit mode on a phone in landscape: category actions at the end of the row', () => {
    setLayoutMode('phone-landscape');
    selectWith(1, true);
    render(<Catalog />);
    expect(screen.queryByTestId('category-toolbar')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'category_management.edit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'category_management.delete' })).toBeInTheDocument();
  });

  it('never truncates category names in the column', () => {
    selectWith(1, false);
    render(<Catalog />);
    expect(screen.getByText('Drinks')).not.toHaveAttribute('data-truncate');
  });
});
