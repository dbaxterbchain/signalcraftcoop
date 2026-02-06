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
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  createDesign,
  createDesignReview,
  getDesigns,
  getOrder,
  updatePaymentStatus,
} from '../api/client';
import type { Design, DesignStatus, Order, PaymentStatus } from '../api/types';
import useAuth from '../auth/useAuth';

type ReviewState = Record<string, { comment: string; status: 'approved' | 'changes-requested' }>;

export default function OrderDetailPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [designs, setDesigns] = useState<Design[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [designError, setDesignError] = useState<string | null>(null);
  const [reviewState, setReviewState] = useState<ReviewState>({});
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [designSubmitting, setDesignSubmitting] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentUpdating, setPaymentUpdating] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [designForm, setDesignForm] = useState<{
    previewUrl: string;
    sourceUrl: string;
    status: DesignStatus;
  }>({
    previewUrl: '',
    sourceUrl: '',
    status: 'in-review',
  });
  const { user } = useAuth();
  const isAdmin = user?.groups?.includes('admin') ?? false;
  const allowMockPayments = import.meta.env.VITE_ALLOW_MOCK_PAYMENTS === 'true';
  const canMockPayments = allowMockPayments || isAdmin;

  const orderLabel = useMemo(
    () => order?.orderNumber ?? order?.id ?? orderId ?? 'Order',
    [order, orderId],
  );

  useEffect(() => {
    if (!orderId) {
      setError('Missing order id.');
      return;
    }
    let active = true;
    Promise.all([getOrder(orderId), getDesigns(orderId)])
      .then(([orderData, designData]) => {
        if (!active) {
          return;
        }
        setOrder(orderData);
        setDesigns(designData);
      })
      .catch((err) => {
        if (!active) {
          return;
        }
        const statusCode = (err as Error & { status?: number }).status;
        setError(
          statusCode === 401
            ? 'Sign in required to view this order.'
            : 'Unable to load order details.',
        );
      });
    return () => {
      active = false;
    };
  }, [orderId]);

  const handleCommentChange = (designId: string, value: string) => {
    setReviewState((prev) => ({
      ...prev,
      [designId]: {
        comment: value,
        status: prev[designId]?.status ?? 'approved',
      },
    }));
  };

  const handleSubmitReview = async (designId: string, status: 'approved' | 'changes-requested') => {
    setSubmitting(designId);
    setError(null);
    try {
      const comment = reviewState[designId]?.comment ?? '';
      await createDesignReview(designId, { status, comment });
      const updated = await getDesigns(orderId ?? '');
      setDesigns(updated);
    } catch (err) {
      const statusCode = (err as Error & { status?: number }).status;
      setError(
        statusCode === 401
          ? 'Sign in required to submit a review.'
          : 'Unable to submit review.',
      );
    } finally {
      setSubmitting(null);
    }
  };

  const handleCreateDesign = async () => {
    if (!orderId) {
      return;
    }
    setDesignSubmitting(true);
    setDesignError(null);
    try {
      const nextVersion =
        designs.length > 0
          ? Math.max(...designs.map((design) => design.version)) + 1
          : 1;
      await createDesign(orderId, {
        version: nextVersion,
        status: designForm.status,
        previewUrl: designForm.previewUrl,
        sourceUrl: designForm.sourceUrl || undefined,
      });
      const updated = await getDesigns(orderId);
      setDesigns(updated);
      setDesignForm((prev) => ({ ...prev, previewUrl: '', sourceUrl: '' }));
    } catch (err) {
      const statusCode = (err as Error & { status?: number }).status;
      setDesignError(
        statusCode === 403
          ? 'Only admins can upload designs right now.'
          : 'Unable to upload design.',
      );
    } finally {
      setDesignSubmitting(false);
    }
  };

  const handlePaymentUpdate = async (status: PaymentStatus) => {
    if (!orderId) {
      return;
    }
    setPaymentUpdating(true);
    setPaymentError(null);
    try {
      const updated = await updatePaymentStatus(orderId, { status });
      setOrder(updated);
      setPaymentDialogOpen(false);
    } catch (err) {
      const statusCode = (err as Error & { status?: number }).status;
      setPaymentError(
        statusCode === 403
          ? 'Payment updates are disabled for this environment.'
          : 'Unable to update payment status.',
      );
    } finally {
      setPaymentUpdating(false);
    }
  };

  return (
    <Box sx={{ py: { xs: 6, md: 10 } }}>
      <Container maxWidth="lg">
        <Stack spacing={2} sx={{ mb: 4 }}>
          <Chip label="Order detail" sx={{ width: 'fit-content', bgcolor: '#EAF4FF' }} />
          <Typography variant="h2">{orderLabel}</Typography>
          {order && (
            <Typography variant="body1" color="text.secondary">
              Type: {order.type} - Status: {order.status}
            </Typography>
          )}
          {error && <Alert severity="info">{error}</Alert>}
        </Stack>

        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Box
              sx={{
                p: 3,
                borderRadius: 3,
                border: '1px solid #C5D6E5',
                backgroundColor: '#FFFFFF',
              }}
            >
              <Typography variant="h4" sx={{ mb: 2 }}>
                Design reviews
              </Typography>
              {isAdmin && (
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    border: '1px dashed #C5D6E5',
                    backgroundColor: '#F8FBFF',
                    mb: 2,
                  }}
                >
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Admin: upload a design proof
                  </Typography>
                  <Stack spacing={2}>
                    <TextField
                      label="Preview URL"
                      placeholder="https://.../design-proof.png"
                      value={designForm.previewUrl}
                      onChange={(event) =>
                        setDesignForm((prev) => ({ ...prev, previewUrl: event.target.value }))
                      }
                      fullWidth
                    />
                    <TextField
                      label="Source URL (optional)"
                      placeholder="https://.../design-source.psd"
                      value={designForm.sourceUrl}
                      onChange={(event) =>
                        setDesignForm((prev) => ({ ...prev, sourceUrl: event.target.value }))
                      }
                      fullWidth
                    />
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Button
                        variant="contained"
                        onClick={handleCreateDesign}
                        disabled={!designForm.previewUrl || designSubmitting}
                      >
                        Upload proof
                      </Button>
                      <Typography variant="caption" color="text.secondary">
                        This creates a new design version for review.
                      </Typography>
                    </Stack>
                    {designError && <Alert severity="info">{designError}</Alert>}
                  </Stack>
                </Box>
              )}
              {designs.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No designs uploaded yet.
                </Typography>
              ) : (
                <Stack spacing={3}>
                  {designs.map((design) => (
                    <Box
                      key={design.id}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        border: '1px solid #C5D6E5',
                        backgroundColor: '#F4F8FB',
                      }}
                    >
                      <Typography variant="subtitle1" sx={{ mb: 1 }}>
                        Design v{design.version} - {design.status}
                      </Typography>
                      <Box
                        sx={{
                          width: '100%',
                          height: 160,
                          borderRadius: 2,
                          bgcolor: '#EAF4FF',
                          border: '1px dashed #C5D6E5',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#6B7B8C',
                          mb: 2,
                        }}
                      >
                        {design.previewUrl ? (
                          <Box
                            component="img"
                            src={design.previewUrl}
                            alt={`Design ${design.version}`}
                            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          'Preview pending'
                        )}
                      </Box>
                      <TextField
                        label="Feedback"
                        placeholder="Add comments or requested changes"
                        fullWidth
                        multiline
                        minRows={2}
                        value={reviewState[design.id]?.comment ?? ''}
                        onChange={(event) => handleCommentChange(design.id, event.target.value)}
                      />
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 2 }}>
                        <Button
                          variant="contained"
                          onClick={() => handleSubmitReview(design.id, 'approved')}
                          disabled={submitting === design.id}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="outlined"
                          onClick={() => handleSubmitReview(design.id, 'changes-requested')}
                          disabled={submitting === design.id}
                        >
                          Request changes
                        </Button>
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              )}
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Box
              sx={{
                p: 3,
                borderRadius: 3,
                border: '1px solid #C5D6E5',
                backgroundColor: '#FFFFFF',
              }}
            >
              <Typography variant="h4" sx={{ mb: 2 }}>
                Order summary
              </Typography>
              {order ? (
                <Stack spacing={1}>
                  <Typography variant="body2" color="text.secondary">
                    Status: {order.status}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Payment: {order.paymentStatus ?? 'TBD'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total: {order.total ? `$${order.total.toFixed(2)}` : 'TBD'}
                  </Typography>
                  {canMockPayments && (
                    <Button
                      variant="outlined"
                      sx={{ mt: 2, alignSelf: 'flex-start' }}
                      onClick={() => setPaymentDialogOpen(true)}
                    >
                      Simulate payment
                    </Button>
                  )}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Order details will appear here once loaded.
                </Typography>
              )}
            </Box>
          </Grid>
        </Grid>
        <Dialog open={paymentDialogOpen} onClose={() => setPaymentDialogOpen(false)}>
          <DialogTitle>Simulate payment</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary">
              Mark this order as paid or failed to keep the flow testable until Stripe is ready.
            </Typography>
            {paymentError && (
              <Alert severity="info" sx={{ mt: 2 }}>
                {paymentError}
              </Alert>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setPaymentDialogOpen(false)}>Cancel</Button>
            <Button
              variant="outlined"
              onClick={() => handlePaymentUpdate('unpaid')}
              disabled={paymentUpdating}
            >
              Mark failed
            </Button>
            <Button
              variant="contained"
              onClick={() => handlePaymentUpdate('paid')}
              disabled={paymentUpdating}
            >
              Mark paid
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}
