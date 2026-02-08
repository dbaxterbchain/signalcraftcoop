import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import CustomOrderPage from './pages/CustomOrderPage';
import ContactPage from './pages/ContactPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import HomePage from './pages/HomePage';
import OrderDetailPage from './pages/OrderDetailPage';
import OrdersPage from './pages/OrdersPage';
import CartPage from './pages/CartPage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import AuthGate from './auth/AuthGate';
import AdminGate from './auth/AdminGate';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import AdminProductsPage from './pages/admin/AdminProductsPage';
import AdminMessagesPage from './pages/admin/AdminMessagesPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="products/:productId" element={<ProductDetailPage />} />
        <Route path="custom-order" element={<CustomOrderPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="auth/callback" element={<AuthCallbackPage />} />
        <Route
          path="cart"
          element={
            <AuthGate>
              <CartPage />
            </AuthGate>
          }
        />
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
        <Route
          path="admin"
          element={
            <AdminGate>
              <AdminDashboardPage />
            </AdminGate>
          }
        />
        <Route
          path="admin/orders"
          element={
            <AdminGate>
              <AdminOrdersPage />
            </AdminGate>
          }
        />
        <Route
          path="admin/orders/:orderId"
          element={
            <AdminGate>
              <OrderDetailPage />
            </AdminGate>
          }
        />
        <Route
          path="admin/products"
          element={
            <AdminGate>
              <AdminProductsPage />
            </AdminGate>
          }
        />
        <Route
          path="admin/messages"
          element={
            <AdminGate>
              <AdminMessagesPage />
            </AdminGate>
          }
        />
      </Route>
    </Routes>
  );
}
