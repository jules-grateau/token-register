import React from 'react';

import styles from './ProductArea.module.css';
import { useGetProductsQuery } from '../../services/product';
import ProductButton from './ProductButton';
import { useDispatch } from 'react-redux';
import { add } from '../../redux/cartSlice';


const ProductArea : React.FC = () => {
    const productsQuery = useGetProductsQuery();
    const dispatch = useDispatch();

  return (
    <div className={styles.productAreaContainer}>
        <h2 className={styles.areaTitle}>Products</h2>
        {productsQuery.isLoading && <p>Loading products...</p>}
        {productsQuery.isError && <p>Error loading products.</p>}
        {productsQuery.isSuccess && productsQuery.data.length === 0 && <p>No products available.</p>}
        {productsQuery.isSuccess && productsQuery.data.length > 0 && (
            <div className={styles.productList}>
                {productsQuery.data.map(product => (
                    <ProductButton
                        key={product.id}
                        product={product}
                        onClick={() => dispatch(add(product))} />
                ))}
            </div>
        )}
    </div>
  );
}

export default ProductArea;