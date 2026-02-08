import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { getAdminOrders } from '../../api/client';
import type { Order } from '../../api/types';

const statusOptions = [
  { value: 'all', label: 'All statuses' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'designing', label: 'Designing' },
  { value: 'review', label: 'Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'production', label: 'Production' },
  { value: 'shipping', label: 'Shipping' },
  { value: 'complete', label: 'Complete' },
  { value: 'on-hold', label: 'On hold' },
  { value: 'canceled', label: 'Canceled' },
];

const typeOptions = [
  { value: 'all', label: 'All types' },
  { value: 'custom', label: 'Custom' },
  { value: 'store', label: 'Store' },
];

const sortOptions = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'total', label: 'Highest total' },
  { value: 'status', label: 'Status (A-Z)' },
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let active = true;
    getAdminOrders()
      .then((data) => {
        if (active) {
          setOrders(data);
        }
      })
      .catch(() => {
        if (active) {
          setError('Unable to load admin orders.');
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    let next = orders;

    if (statusFilter !== 'all') {
      next = next.filter((order) => order.status === statusFilter);
    }

    if (typeFilter !== 'all') {
      next = next.filter((order) => order.type === typeFilter);
    }

    if (query) {
      next = next.filter((order) => {
        const orderNumber = order.orderNumber?.toLowerCase() ?? '';
        const orderId = order.id.toLowerCase();
        const itemMatch = order.items?.some((item) =>
          item.title.toLowerCase().includes(query),
        );
        return (
          orderNumber.includes(query) ||
          orderId.includes(query) ||
          itemMatch ||
          order.status.toLowerCase().includes(query)
        );
      });
    }

    const sorted = [...next];
    sorted.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (sortBy === 'oldest') {
        return dateA - dateB;
      }
      if (sortBy === 'total') {
        return (b.total ?? 0) - (a.total ?? 0);
      }
      if (sortBy === 'status') {
        return a.status.localeCompare(b.status);
      }
      return dateB - dateA;
    });

    return sorted;
  }, [orders, search, sortBy, statusFilter, typeFilter]);

  return (
    <Box sx={{ py: { xs: 6, md: 10 } }}>
      <Container maxWidth="lg">
        <Stack spacing={2} sx={{ mb: 4 }}>
          <Chip
            label="Admin orders"
            sx={{ width: 'fit-content', bgcolor: '#EAF4FF' }}
          />
          <Typography variant="h2">Order management</Typography>
          <Typography variant="body1" color="text.secondary">
            Review customer orders, update statuses, and upload design proofs.
          </Typography>
          {error && <Alert severity="info">{error}</Alert>}
        </Stack>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          alignItems={{ xs: 'stretch', md: 'center' }}
          sx={{ mb: 3 }}
        >
          <TextField
            label="Search"
            placeholder="Order number, id, or status"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            size="small"
            sx={{ minWidth: { xs: '100%', md: 220 } }}
          />
          <TextField
            select
            label="Status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            size="small"
            sx={{ minWidth: { xs: '100%', md: 180 } }}
          >
            {statusOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Type"
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            size="small"
            sx={{ minWidth: { xs: '100%', md: 160 } }}
          >
            {typeOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Sort"
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
            size="small"
            sx={{ minWidth: { xs: '100%', md: 180 } }}
          >
            {sortOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
          <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
            Showing {filteredOrders.length} of {orders.length}
          </Typography>
        </Stack>
        <Grid container spacing={3}>
          {filteredOrders.map((order) => (
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
                  {order.paymentStatus && (
                    <Typography variant="body2" color="text.secondary">
                      Payment: {order.paymentStatus}
                    </Typography>
                  )}
                  <Button
                    component={RouterLink}
                    to={`/admin/orders/${order.id}`}
                    variant="outlined"
                    sx={{ alignSelf: 'flex-start' }}
                  >
                    Manage order
                  </Button>
                  <Button
                    component={RouterLink}
                    to={`/admin/orders/${order.id}?view=customer`}
                    variant="text"
                    sx={{ alignSelf: 'flex-start' }}
                  >
                    View as customer
                  </Button>
                </Stack>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
