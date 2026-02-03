import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import CustomOrderPage from './pages/CustomOrderPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import HomePage from './pages/HomePage';
import OrderDetailPage from './pages/OrderDetailPage';
import OrdersPage from './pages/OrdersPage';
import ProductsPage from './pages/ProductsPage';
import AuthGate from './auth/AuthGate';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="custom-order" element={<CustomOrderPage />} />
        <Route path="auth/callback" element={<AuthCallbackPage />} />
        <Route
          path="orders"
          element={
            <AuthGate>
              <OrdersPage />
            </AuthGate>
          }
        />
        <Route
          path="orders/:orderId"
          element={
            <AuthGate>
              <OrderDetailPage />
            </AuthGate>
          }
        />
      </Route>
    </Routes>
  );
}
