
import { useDispatch, useSelector } from 'react-redux';
import ProductButton from './components/ProductButton';
import { useGetProductsQuery } from './services/product';
import { add, remove, clear, selectCartItems, selectTotalPrice } from './redux/cartSlice';
import { useAddOrderMutation, useGetOrdersQuery, useRemoveOrderMutation } from './services/orders';
import type { CartItem } from 'shared-ts';

function App() {
  const productsQuery = useGetProductsQuery();
  const ordersQuery = useGetOrdersQuery();
  const [addOrder] = useAddOrderMutation();
  const [removeOrder] = useRemoveOrderMutation();
  const cartItems = useSelector(selectCartItems);
  const totalPrice = useSelector(selectTotalPrice);
  const dispatch = useDispatch();

  const onAddOrder = async (cartItems : CartItem[]) => {
    try {
      const response = await addOrder(cartItems).unwrap();
      console.log('Order added:', response);
    } catch (error) {
      console.error('Error adding order:', error);
    }
    finally {
      dispatch(clear());
      ordersQuery.refetch();
    }
  }; 
  
  const onRemoveOrder = async (id : number) => {
    try {
      const response = await removeOrder(id).unwrap();
      console.log('Order removed:', response);
    } catch (error) {
      console.error('Error removing order:', error);
    }
    finally {
      ordersQuery.refetch();
    }
  };

  if(productsQuery.isLoading) {
    return <div>Loading ...</div>
  }
  if(productsQuery.error) {
    let errorMessage = 'Unknown error';
    if ('status' in productsQuery.error) {
      errorMessage = `Status: ${productsQuery.error.status}`;
      if (typeof productsQuery.error.data === 'string') {
        errorMessage += ` - ${productsQuery.error.data}`;
      }
    } else if ('message' in productsQuery.error) {
      errorMessage = productsQuery.error.message as string;
    }
    return <div>Error: {errorMessage}</div>
  } 

  return (
    <>
      <h1>Product List</h1>
        {productsQuery.data?.map(product => (
          <ProductButton
            key={product.id}
            product={product}
            onClick={() => dispatch(add(product))}
          />
        ))}

      <h2>Cart</h2>
      {cartItems.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <>
        <ul>
          {cartItems.map((item, index) => (
            <li key={index}>
              {item.product.name} - x{item.quantity}
              <button onClick={() => dispatch(remove(index))}>Remove</button>
            </li>
          ))}
        </ul>
          <p>Total Price : {totalPrice}</p>
          <button onClick={() => onAddOrder(cartItems)}>Checkout</button>
        </>

      )}
      <h2>Orders</h2>
      {ordersQuery.isLoading ? (
        <p>Loading orders...</p>
      ) : ordersQuery.error ? (
        <p>Error loading orders: {JSON.stringify(ordersQuery.error)}</p>
      ) : (
        <ul>
          {ordersQuery.data?.map(order => (
            <li key={order.id}>
              Order ID: {order.id} - Date: {new Date(order.date).toLocaleString('fr-FR')}
              <ul>
                {order.items.map((item, index) => (
                  <li key={index}>
                    {item.product.name} - x{item.quantity}
                  </li>
                ))}
              </ul>
              <button onClick={() => onRemoveOrder(order.id)}>Remove</button>
            </li>
          ))}
        </ul>
      )}
   </>
  )
}

export default App
