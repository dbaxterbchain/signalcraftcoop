import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Stack,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { createOrder, getOrders } from '../api/client';
import type { CreateOrderPayload, Order } from '../api/types';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [reorderId, setReorderId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    getOrders()
      .then((data) => {
        if (active) {
          setOrders(data);
        }
      })
      .catch((err) => {
        if (active) {
          const statusCode = (err as Error & { status?: number }).status;
          setError(
            statusCode === 401
              ? 'Sign in required to view orders.'
              : 'Unable to load orders right now.',
          );
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const handleReorder = async (order: Order) => {
    if (!order.items || order.items.length === 0) {
      setError('Unable to reorder: missing order items.');
      return;
    }
    setReorderId(order.id);
    setError(null);
    try {
      const payload: CreateOrderPayload = {
        type: order.type === 'store' ? 'store' : 'custom',
        items: order.items.map((item) => ({
          productId: item.productId,
          title: item.title,
          sku: item.sku,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          nfcConfig: item.nfcConfig,
          designId: item.designId,
          metadata: item.metadata,
        })),
      };
      const newOrder = await createOrder(payload);
      navigate(`/orders/${newOrder.id}`);
    } catch {
      setError('Unable to reorder right now.');
    } finally {
      setReorderId(null);
    }
  };

  return (
    <Box sx={{ py: { xs: 6, md: 10 } }}>
      <Container maxWidth="lg">
        <Stack spacing={2} sx={{ mb: 6 }}>
          <Chip label="Orders" sx={{ width: 'fit-content', bgcolor: '#EAF4FF' }} />
          <Typography variant="h2">Your orders</Typography>
          <Typography variant="body1" color="text.secondary">
            Track custom and store orders, review designs, and request reorders.
          </Typography>
          {error && <Alert severity="info">{error}</Alert>}
        </Stack>

        {orders.length === 0 && !error ? (
          <Box
            sx={{
              p: 4,
              borderRadius: 3,
              border: '1px dashed #C5D6E5',
              textAlign: 'center',
              backgroundColor: '#F4F8FB',
            }}
          >
            <Typography variant="h4" sx={{ mb: 1 }}>
              No orders yet
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Start a custom order or browse standard products to get started.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
              <Button component={RouterLink} to="/custom-order" variant="contained">
                Start a custom order
              </Button>
              <Button component={RouterLink} to="/products" variant="outlined">
                Browse products
              </Button>
            </Stack>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {orders.map((order) => (
              <Grid size={{ xs: 12, md: 6 }} key={order.id}>
                <Box
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    border: '1px solid #C5D6E5',
                    backgroundColor: '#FFFFFF',
                    boxShadow: '0 6px 24px rgba(10, 42, 67, 0.12)',
                  }}
                >
                  <Stack spacing={1}>
                    <Typography variant="h4">
                      {order.orderNumber ?? order.id}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Type: {order.type} - Status: {order.status}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total: {order.total ? `$${order.total.toFixed(2)}` : 'TBD'}
                    </Typography>
                    <Stack direction="row" spacing={2} sx={{ alignSelf: 'flex-start' }}>
                      <Button component={RouterLink} to={`/orders/${order.id}`} variant="outlined">
                        View order
                      </Button>
                      {order.status === 'complete' && (
                        <Button
                          variant="contained"
                          onClick={() => handleReorder(order)}
                          disabled={reorderId === order.id}
                        >
                          {reorderId === order.id ? 'Reordering...' : 'Reorder'}
                        </Button>
                      )}
                    </Stack>
                  </Stack>
                </Box>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </Box>
  );
}
