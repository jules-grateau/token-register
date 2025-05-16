
import { useDispatch, useSelector } from 'react-redux';
import ProductButton from './components/ProductButton';
import { useGetProductsQuery } from './services/product';
import { add, remove, selectBasketItems, selectTotalPrice } from './redux/basketSlice';

function App() {
  const {data, error, isLoading} = useGetProductsQuery();
  const basketItems = useSelector(selectBasketItems);
  const totalPrice = useSelector(selectTotalPrice);
  const dispatch = useDispatch();

  if(isLoading) {
    return <div>Loading ...</div>
  }
  if(error) {
    let errorMessage = 'Unknown error';
    if ('status' in error) {
      errorMessage = `Status: ${error.status}`;
      if (typeof error.data === 'string') {
        errorMessage += ` - ${error.data}`;
      }
    } else if ('message' in error) {
      errorMessage = error.message as string;
    }
    return <div>Error: {errorMessage}</div>
  } 

  return (
    <>
      <h1>Product List</h1>
        {data?.map(product => (
          <ProductButton
            key={product.id}
            product={product}
            onClick={() => dispatch(add(product))}
          />
        ))}

      <h2>Basket</h2>
      {basketItems.length === 0 ? (
        <p>Your basket is empty.</p>
      ) : (
        <>
        <ul>
          {basketItems.map((item, index) => (
            <li key={index}>
              {item.product.name} - x{item.quantity}
              <button onClick={() => dispatch(remove(index))}>Remove</button>
            </li>
          ))}
        </ul>
          <p>Total Price : {totalPrice}</p>
        </>

      )}
   </>
  )
}

export default App
