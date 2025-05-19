import { Bounce, ToastContainer } from 'react-toastify';
import { Register } from './components/Register';

function App() {
  return (
    <div className="app-container">
      <ToastContainer
      position="top-center"
      autoClose={5000}
      hideProgressBar={true}
      newestOnTop={false}
      closeOnClick={true}
      rtl={false}
      theme="colored"
      transition={Bounce}
      />
      <Register />
    </div>
  )
}

export default App
