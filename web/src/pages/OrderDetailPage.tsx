import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  createDesign,
  createDesignReview,
  createOrderEvent,
  createUploadUrl,
  getDesigns,
  getOrder,
  updateOrderStatus,
  updateOrderShipping,
  updatePaymentStatus,
} from '../api/client';
import type {
  Design,
  DesignStatus,
  Order,
  OrderStatus,
  PaymentStatus,
} from '../api/types';
import useAuth from '../auth/useAuth';

type ReviewState = Record<string, { comment: string; status: 'approved' | 'changes-requested' }>;
const orderStatusOptions: { value: OrderStatus; label: string }[] = [
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

export default function OrderDetailPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [designs, setDesigns] = useState<Design[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [designError, setDesignError] = useState<string | null>(null);
  const [reviewState, setReviewState] = useState<ReviewState>({});
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [designSubmitting, setDesignSubmitting] = useState(false);
  const [designUploading, setDesignUploading] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentUpdating, setPaymentUpdating] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [orderStatus, setOrderStatus] = useState<OrderStatus>('submitted');
  const [orderStatusUpdating, setOrderStatusUpdating] = useState(false);
  const [orderStatusError, setOrderStatusError] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [designForm, setDesignForm] = useState<{
    previewUrl: string;
    sourceUrl: string;
    status: DesignStatus;
  }>({
    previewUrl: '',
    sourceUrl: '',
    status: 'in-review',
  });
  const [shippingForm, setShippingForm] = useState({
    shippingCarrier: '',
    shippingService: '',
    trackingNumber: '',
    trackingUrl: '',
    shippedAt: '',
    deliveredAt: '',
  });
  const [shippingUpdating, setShippingUpdating] = useState(false);
  const [shippingError, setShippingError] = useState<string | null>(null);
  const [eventForm, setEventForm] = useState({
    type: 'note',
    title: '',
    description: '',
    isCustomerVisible: true,
  });
  const [eventSubmitting, setEventSubmitting] = useState(false);
  const [eventError, setEventError] = useState<string | null>(null);
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const isAdmin = user?.groups?.includes('admin') ?? false;
  const isImpersonating = isAdmin && searchParams.get('view') === 'customer';
  const showAdminControls = isAdmin && !isImpersonating;
  const allowMockPayments = import.meta.env.VITE_ALLOW_MOCK_PAYMENTS === 'true';
  const canMockPayments = allowMockPayments || isAdmin;

  const orderLabel = useMemo(
    () => order?.orderNumber ?? order?.id ?? orderId ?? 'Order',
    [order, orderId],
  );
  const visibleEvents = useMemo(() => {
    if (!order?.events) {
      return [];
    }
    if (isImpersonating) {
      return order.events.filter((event) => event.isCustomerVisible !== false);
    }
    return order.events;
  }, [isImpersonating, order?.events]);

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

  useEffect(() => {
    if (order?.status) {
      setOrderStatus(order.status);
    }
  }, [order?.status]);

  useEffect(() => {
    if (!order) {
      return;
    }
    setShippingForm({
      shippingCarrier: order.shippingCarrier ?? '',
      shippingService: order.shippingService ?? '',
      trackingNumber: order.trackingNumber ?? '',
      trackingUrl: order.trackingUrl ?? '',
      shippedAt: order.shippedAt ?? '',
      deliveredAt: order.deliveredAt ?? '',
    });
  }, [order]);

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
    if (!designForm.previewUrl && !previewFile) {
      setDesignError('Add a preview URL or upload a preview file.');
      return;
    }
    setDesignSubmitting(true);
    setDesignError(null);
    try {
      const nextVersion =
        designs.length > 0
          ? Math.max(...designs.map((design) => design.version)) + 1
          : 1;
      let previewUrl = designForm.previewUrl;
      let sourceUrl = designForm.sourceUrl;

      if (previewFile) {
        setDesignUploading(true);
        const { uploadUrl, fileUrl } = await createUploadUrl({
          orderId,
          category: 'preview',
          fileName: previewFile.name,
          contentType: previewFile.type || 'application/octet-stream',
        });
        const response = await fetch(uploadUrl, {
          method: 'PUT',
          body: previewFile,
          headers: {
            'Content-Type': previewFile.type || 'application/octet-stream',
          },
        });
        if (!response.ok) {
          throw new Error('Preview upload failed.');
        }
        previewUrl = fileUrl;
      }

      if (sourceFile) {
        setDesignUploading(true);
        const { uploadUrl, fileUrl } = await createUploadUrl({
          orderId,
          category: 'source',
          fileName: sourceFile.name,
          contentType: sourceFile.type || 'application/octet-stream',
        });
        const response = await fetch(uploadUrl, {
          method: 'PUT',
          body: sourceFile,
          headers: {
            'Content-Type': sourceFile.type || 'application/octet-stream',
          },
        });
        if (!response.ok) {
          throw new Error('Source upload failed.');
        }
        sourceUrl = fileUrl;
      }

      await createDesign(orderId, {
        version: nextVersion,
        status: designForm.status,
        previewUrl,
        sourceUrl: sourceUrl || undefined,
      });
      const updated = await getDesigns(orderId);
      setDesigns(updated);
      setDesignForm((prev) => ({ ...prev, previewUrl: '', sourceUrl: '' }));
      setPreviewFile(null);
      setSourceFile(null);
    } catch (err) {
      const statusCode = (err as Error & { status?: number }).status;
      setDesignError(
        statusCode === 403
          ? 'Only admins can upload designs right now.'
          : (err as Error).message || 'Unable to upload design.',
      );
    } finally {
      setDesignSubmitting(false);
      setDesignUploading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!orderId) {
      return;
    }
    setOrderStatusUpdating(true);
    setOrderStatusError(null);
    try {
      const updated = await updateOrderStatus(orderId, { status: orderStatus });
      setOrder(updated);
    } catch (err) {
      const statusCode = (err as Error & { status?: number }).status;
      setOrderStatusError(
        statusCode === 403
          ? 'Only admins can update order status.'
          : 'Unable to update order status.',
      );
    } finally {
      setOrderStatusUpdating(false);
    }
  };

  const handleShippingUpdate = async () => {
    if (!orderId) {
      return;
    }
    setShippingUpdating(true);
    setShippingError(null);
    try {
      const updated = await updateOrderShipping(orderId, {
        shippingCarrier: shippingForm.shippingCarrier || undefined,
        shippingService: shippingForm.shippingService || undefined,
        trackingNumber: shippingForm.trackingNumber || undefined,
        trackingUrl: shippingForm.trackingUrl || undefined,
        shippedAt: shippingForm.shippedAt || undefined,
        deliveredAt: shippingForm.deliveredAt || undefined,
      });
      setOrder(updated);
    } catch (err) {
      const statusCode = (err as Error & { status?: number }).status;
      setShippingError(
        statusCode === 403
          ? 'Only admins can update shipping details.'
          : 'Unable to update shipping details.',
      );
    } finally {
      setShippingUpdating(false);
    }
  };

  const handleAddEvent = async () => {
    if (!orderId) {
      return;
    }
    if (!eventForm.title.trim()) {
      setEventError('Add a title for the update.');
      return;
    }
    setEventSubmitting(true);
    setEventError(null);
    try {
      await createOrderEvent(orderId, {
        type: eventForm.type,
        title: eventForm.title.trim(),
        description: eventForm.description.trim() || undefined,
        isCustomerVisible: eventForm.isCustomerVisible,
      });
      const updated = await getOrder(orderId);
      setOrder(updated);
      setEventForm({
        type: 'note',
        title: '',
        description: '',
        isCustomerVisible: true,
      });
    } catch (err) {
      const statusCode = (err as Error & { status?: number }).status;
      setEventError(
        statusCode === 403
          ? 'Only admins can add updates.'
          : 'Unable to add an update.',
      );
    } finally {
      setEventSubmitting(false);
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
          {isAdmin && (
            <Stack direction="row" spacing={2} alignItems="center">
              {isImpersonating ? (
                <Button
                  variant="outlined"
                  onClick={() => setSearchParams({})}
                >
                  Return to admin view
                </Button>
              ) : (
                <Button
                  variant="outlined"
                  onClick={() => setSearchParams({ view: 'customer' })}
                >
                  View as customer
                </Button>
              )}
            </Stack>
          )}
          {isImpersonating && (
            <Alert severity="info">
              Viewing as customer. Admin actions are hidden.
            </Alert>
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
              {showAdminControls && (
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
                    <Stack spacing={1}>
                      <Typography variant="caption" color="text.secondary">
                        Preview proof
                      </Typography>
                      <Button variant="outlined" component="label">
                        {previewFile ? 'Change preview file' : 'Select preview file'}
                        <input
                          type="file"
                          hidden
                          accept="image/*"
                          onChange={(event) =>
                            setPreviewFile(event.target.files?.[0] ?? null)
                          }
                        />
                      </Button>
                      {previewFile && (
                        <Typography variant="caption" color="text.secondary">
                          Selected: {previewFile.name}
                        </Typography>
                      )}
                    </Stack>
                    <TextField
                      label="Preview URL"
                      placeholder="https://.../design-proof.png"
                      value={designForm.previewUrl}
                      onChange={(event) =>
                        setDesignForm((prev) => ({ ...prev, previewUrl: event.target.value }))
                      }
                      fullWidth
                    />
                    <Stack spacing={1}>
                      <Typography variant="caption" color="text.secondary">
                        Source file (optional)
                      </Typography>
                      <Button variant="outlined" component="label">
                        {sourceFile ? 'Change source file' : 'Select source file'}
                        <input
                          type="file"
                          hidden
                          onChange={(event) =>
                            setSourceFile(event.target.files?.[0] ?? null)
                          }
                        />
                      </Button>
                      {sourceFile && (
                        <Typography variant="caption" color="text.secondary">
                          Selected: {sourceFile.name}
                        </Typography>
                      )}
                    </Stack>
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
                        disabled={
                          (!designForm.previewUrl && !previewFile) ||
                          designSubmitting ||
                          designUploading
                        }
                      >
                        {designUploading ? 'Uploading...' : 'Upload proof'}
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
                  {(order.trackingNumber || order.trackingUrl) && (
                    <Typography variant="body2" color="text.secondary">
                      Tracking: {order.trackingNumber ?? 'Available'}
                    </Typography>
                  )}
                  {order.shippedAt && (
                    <Typography variant="body2" color="text.secondary">
                      Shipped: {new Date(order.shippedAt).toLocaleDateString()}
                    </Typography>
                  )}
                  {order.deliveredAt && (
                    <Typography variant="body2" color="text.secondary">
                      Delivered: {new Date(order.deliveredAt).toLocaleDateString()}
                    </Typography>
                  )}
                  {order.trackingUrl && (
                    <Button
                      component="a"
                      href={order.trackingUrl}
                      target="_blank"
                      rel="noreferrer"
                      variant="text"
                      sx={{ alignSelf: 'flex-start' }}
                    >
                      View tracking
                    </Button>
                  )}
                  {showAdminControls && (
                    <Stack spacing={1} sx={{ mt: 2 }}>
                      <TextField
                        select
                        label="Order status"
                        value={orderStatus}
                        onChange={(event) =>
                          setOrderStatus(event.target.value as OrderStatus)
                        }
                      >
                        {orderStatusOptions.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </TextField>
                      <Button
                        variant="outlined"
                        onClick={handleStatusUpdate}
                        disabled={orderStatusUpdating || orderStatus === order.status}
                        sx={{ alignSelf: 'flex-start' }}
                      >
                        {orderStatusUpdating ? 'Updating...' : 'Update status'}
                      </Button>
                        {orderStatusError && (
                          <Alert severity="info">{orderStatusError}</Alert>
                        )}
                      <Box
                        sx={{
                          mt: 2,
                          p: 2,
                          borderRadius: 2,
                          border: '1px dashed #C5D6E5',
                          backgroundColor: '#F8FBFF',
                        }}
                      >
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                          Shipping details
                        </Typography>
                        <Stack spacing={2}>
                          <TextField
                            label="Carrier"
                            value={shippingForm.shippingCarrier}
                            onChange={(event) =>
                              setShippingForm((prev) => ({
                                ...prev,
                                shippingCarrier: event.target.value,
                              }))
                            }
                          />
                          <TextField
                            label="Service"
                            value={shippingForm.shippingService}
                            onChange={(event) =>
                              setShippingForm((prev) => ({
                                ...prev,
                                shippingService: event.target.value,
                              }))
                            }
                          />
                          <TextField
                            label="Tracking number"
                            value={shippingForm.trackingNumber}
                            onChange={(event) =>
                              setShippingForm((prev) => ({
                                ...prev,
                                trackingNumber: event.target.value,
                              }))
                            }
                          />
                          <TextField
                            label="Tracking URL"
                            value={shippingForm.trackingUrl}
                            onChange={(event) =>
                              setShippingForm((prev) => ({
                                ...prev,
                                trackingUrl: event.target.value,
                              }))
                            }
                          />
                          <TextField
                            label="Shipped at (ISO)"
                            placeholder="2026-02-07T00:00:00Z"
                            value={shippingForm.shippedAt}
                            onChange={(event) =>
                              setShippingForm((prev) => ({
                                ...prev,
                                shippedAt: event.target.value,
                              }))
                            }
                          />
                          <TextField
                            label="Delivered at (ISO)"
                            placeholder="2026-02-10T00:00:00Z"
                            value={shippingForm.deliveredAt}
                            onChange={(event) =>
                              setShippingForm((prev) => ({
                                ...prev,
                                deliveredAt: event.target.value,
                              }))
                            }
                          />
                          <Button
                            variant="outlined"
                            onClick={handleShippingUpdate}
                            disabled={shippingUpdating}
                            sx={{ alignSelf: 'flex-start' }}
                          >
                            {shippingUpdating ? 'Updating...' : 'Update shipping'}
                          </Button>
                          {shippingError && (
                            <Alert severity="info">{shippingError}</Alert>
                          )}
                        </Stack>
                      </Box>
                    </Stack>
                  )}
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
        <Box
          sx={{
            mt: 4,
            p: 3,
            borderRadius: 3,
            border: '1px solid #C5D6E5',
            backgroundColor: '#FFFFFF',
          }}
        >
          <Typography variant="h4" sx={{ mb: 2 }}>
            Order updates
          </Typography>
          {showAdminControls && (
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                border: '1px dashed #C5D6E5',
                backgroundColor: '#F8FBFF',
                mb: 3,
              }}
            >
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Add an update
              </Typography>
              <Stack spacing={2}>
                <TextField
                  label="Type"
                  value={eventForm.type}
                  onChange={(event) =>
                    setEventForm((prev) => ({ ...prev, type: event.target.value }))
                  }
                />
                <TextField
                  label="Title"
                  value={eventForm.title}
                  onChange={(event) =>
                    setEventForm((prev) => ({ ...prev, title: event.target.value }))
                  }
                />
                <TextField
                  label="Description"
                  value={eventForm.description}
                  multiline
                  minRows={2}
                  onChange={(event) =>
                    setEventForm((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={eventForm.isCustomerVisible}
                      onChange={(event) =>
                        setEventForm((prev) => ({
                          ...prev,
                          isCustomerVisible: event.target.checked,
                        }))
                      }
                    />
                  }
                  label="Visible to customer"
                />
                <Button
                  variant="outlined"
                  onClick={handleAddEvent}
                  disabled={eventSubmitting}
                  sx={{ alignSelf: 'flex-start' }}
                >
                  {eventSubmitting ? 'Saving...' : 'Add update'}
                </Button>
                {eventError && <Alert severity="info">{eventError}</Alert>}
              </Stack>
            </Box>
          )}
          {visibleEvents.length > 0 ? (
            <Stack spacing={2}>
              {visibleEvents.map((event) => (
                <Box
                  key={event.id}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    border: '1px solid #E0E7EF',
                    backgroundColor: '#F4F8FB',
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="subtitle1">{event.title}</Typography>
                    {showAdminControls && event.isCustomerVisible === false && (
                      <Chip label="Internal" size="small" />
                    )}
                  </Stack>
                  {event.description && (
                    <Typography variant="body2" color="text.secondary">
                      {event.description}
                    </Typography>
                  )}
                  <Typography variant="caption" color="text.secondary">
                    {event.createdAt
                      ? new Date(event.createdAt).toLocaleString()
                      : 'Just now'}
                    {event.createdBy ? ` - ${event.createdBy}` : ''}
                  </Typography>
                </Box>
              ))}
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No updates yet.
            </Typography>
          )}
        </Box>
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
