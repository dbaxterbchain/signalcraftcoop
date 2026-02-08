import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { useMemo, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { createOrder } from '../api/client';
import type { Address, CreateOrderPayload } from '../api/types';
import { useCart } from '../cart/CartContext';

const blankAddress: Address = {
  line1: '',
  line2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'US',
};

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, total } = useCart();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [shipping, setShipping] = useState<Address>(blankAddress);
  const [billingSame, setBillingSame] = useState(true);
  const [billing, setBilling] = useState<Address>(blankAddress);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );

  const handleCheckout = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const payload: CreateOrderPayload = {
        type: 'store',
        items: items.map((item) => ({
          productId: item.productId,
          title: item.title,
          sku: item.sku,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          nfcConfig: item.nfcUrl ? { url: item.nfcUrl } : undefined,
          metadata: {
            logoUrl: item.logoUrl,
            logoFileName: item.logoFileName,
          },
        })),
        shippingAddress: shipping,
        billingAddress: billingSame ? shipping : billing,
      };
      const order = await createOrder(payload);
      clearCart();
      setCheckoutOpen(false);
      navigate(`/orders/${order.id}`);
    } catch (err) {
      const statusCode = (err as Error & { status?: number }).status;
      setError(
        statusCode === 401
          ? 'Please sign in before checking out.'
          : 'Unable to place order right now.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ py: { xs: 6, md: 10 } }}>
      <Container maxWidth="lg">
        <Stack spacing={2} sx={{ mb: 4 }}>
          <Chip label="Cart" sx={{ width: 'fit-content', bgcolor: '#EAF4FF' }} />
          <Typography variant="h2">Your cart</Typography>
          <Typography variant="body1" color="text.secondary">
            Review your standard products before checkout.
          </Typography>
          {error && <Alert severity="info">{error}</Alert>}
        </Stack>

        {items.length === 0 ? (
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
              Your cart is empty
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Browse products to start a standard order.
            </Typography>
            <Button component={RouterLink} to="/products" variant="contained">
              Browse products
            </Button>
          </Box>
        ) : (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 8 }}>
              <Stack spacing={2}>
                {items.map((item) => (
                  <Box
                    key={item.id}
                    sx={{
                      p: 3,
                      borderRadius: 3,
                      border: '1px solid #C5D6E5',
                      backgroundColor: '#FFFFFF',
                    }}
                  >
                    <Stack spacing={1}>
                      <Typography variant="h4">{item.title}</Typography>
                      {item.sku && (
                        <Typography variant="body2" color="text.secondary">
                          SKU: {item.sku}
                        </Typography>
                      )}
                      <Typography variant="body2" color="text.secondary">
                        Unit price: ${item.unitPrice.toFixed(2)}
                      </Typography>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <TextField
                          label="Qty"
                          type="number"
                          value={item.quantity}
                          onChange={(event) =>
                            updateQuantity(item.id, Number(event.target.value))
                          }
                          inputProps={{ min: 1 }}
                          sx={{ maxWidth: 120 }}
                        />
                        <Button
                          variant="text"
                          color="error"
                          onClick={() => removeItem(item.id)}
                        >
                          Remove
                        </Button>
                      </Stack>
                      {item.nfcUrl && (
                        <Typography variant="body2" color="text.secondary">
                          NFC: {item.nfcUrl}
                        </Typography>
                      )}
                      {item.logoFileName && (
                        <Typography variant="body2" color="text.secondary">
                          Logo file: {item.logoFileName}
                        </Typography>
                      )}
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Box
                sx={{
                  p: 3,
                  borderRadius: 3,
                  border: '1px solid #C5D6E5',
                  backgroundColor: '#FFFFFF',
                }}
              >
                <Stack spacing={2}>
                  <Typography variant="h4">Summary</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Items: {itemCount}
                  </Typography>
                  <Typography variant="h5">Total: ${total.toFixed(2)}</Typography>
                  <Button variant="contained" onClick={() => setCheckoutOpen(true)}>
                    Checkout
                  </Button>
                  <Button component={RouterLink} to="/products" variant="outlined">
                    Continue shopping
                  </Button>
                </Stack>
              </Box>
            </Grid>
          </Grid>
        )}
      </Container>

      <Dialog open={checkoutOpen} onClose={() => setCheckoutOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Shipping details</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Address line 1"
              value={shipping.line1}
              onChange={(event) =>
                setShipping((prev) => ({ ...prev, line1: event.target.value }))
              }
            />
            <TextField
              label="Address line 2"
              value={shipping.line2}
              onChange={(event) =>
                setShipping((prev) => ({ ...prev, line2: event.target.value }))
              }
            />
            <TextField
              label="City"
              value={shipping.city}
              onChange={(event) =>
                setShipping((prev) => ({ ...prev, city: event.target.value }))
              }
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="State"
                value={shipping.state}
                onChange={(event) =>
                  setShipping((prev) => ({ ...prev, state: event.target.value }))
                }
                fullWidth
              />
              <TextField
                label="Postal code"
                value={shipping.postalCode}
                onChange={(event) =>
                  setShipping((prev) => ({ ...prev, postalCode: event.target.value }))
                }
                fullWidth
              />
            </Stack>
            <TextField
              label="Country"
              value={shipping.country}
              onChange={(event) =>
                setShipping((prev) => ({ ...prev, country: event.target.value }))
              }
            />
            {!billingSame && (
              <>
                <Typography variant="subtitle2">Billing address</Typography>
                <TextField
                  label="Billing line 1"
                  value={billing.line1}
                  onChange={(event) =>
                    setBilling((prev) => ({ ...prev, line1: event.target.value }))
                  }
                />
                <TextField
                  label="Billing line 2"
                  value={billing.line2}
                  onChange={(event) =>
                    setBilling((prev) => ({ ...prev, line2: event.target.value }))
                  }
                />
                <TextField
                  label="Billing city"
                  value={billing.city}
                  onChange={(event) =>
                    setBilling((prev) => ({ ...prev, city: event.target.value }))
                  }
                />
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField
                    label="Billing state"
                    value={billing.state}
                    onChange={(event) =>
                      setBilling((prev) => ({ ...prev, state: event.target.value }))
                    }
                    fullWidth
                  />
                  <TextField
                    label="Billing postal code"
                    value={billing.postalCode}
                    onChange={(event) =>
                      setBilling((prev) => ({ ...prev, postalCode: event.target.value }))
                    }
                    fullWidth
                  />
                </Stack>
                <TextField
                  label="Billing country"
                  value={billing.country}
                  onChange={(event) =>
                    setBilling((prev) => ({ ...prev, country: event.target.value }))
                  }
                />
              </>
            )}
            <Button
              variant="text"
              onClick={() => setBillingSame((prev) => !prev)}
            >
              {billingSame ? 'Use different billing address' : 'Billing same as shipping'}
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCheckoutOpen(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleCheckout} disabled={submitting}>
            {submitting ? 'Placing order...' : 'Place order'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
