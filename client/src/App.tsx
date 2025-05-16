import './App.css'
import { useProducts } from './hooks/productHooks'

function App() {
  const products = useProducts();

  if(products.isLoading) {
    return <div>Kikou</div>
  }
  if(products.error) {
    return <div>Error: {products.error}</div>
  } 

  return (
    <>
      <h1>Product List</h1>
      <ul>
        {products.products.map(product => (
          <li key={product.id}>
            <h2>{product.name}</h2>
            <p>{product.price}</p>
          </li>
        ))}
      </ul>
    </>
  )
}

export default App
