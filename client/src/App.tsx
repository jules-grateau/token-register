import { useGetOrdersQuery, useRemoveOrderMutation } from './services/orders';
import { Register } from './components/Register';

function App() {
  const ordersQuery = useGetOrdersQuery();
  const [removeOrder] = useRemoveOrderMutation();


  
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

  return (
    <div className="app-container">
      <Register />
    </div>
  )
}

export default App
