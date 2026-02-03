import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import type { ChangeEvent } from 'react';
import { useState } from 'react';
import { createOrder } from '../api/client';

export default function CustomOrderPage() {
  const [form, setForm] = useState({
    businessName: '',
    contactName: '',
    email: '',
    phone: '',
    product: '',
    nfcLink: '',
    quantity: '',
    deadline: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  );

  const handleChange =
    (field: keyof typeof form) => (event: ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleSubmit = async () => {
    setStatus(null);
    setSubmitting(true);
    try {
      const quantity = Number.parseInt(form.quantity || '1', 10);
      await createOrder({
        type: 'custom',
        items: [
          {
            title: form.product || 'Custom order request',
            quantity: Number.isNaN(quantity) ? 1 : Math.max(1, quantity),
            unitPrice: 1,
            nfcConfig: form.nfcLink ? { url: form.nfcLink } : undefined,
          },
        ],
      });
      setStatus({
        type: 'success',
        message: 'Request submitted. We will follow up with design questions soon.',
      });
      setForm({
        businessName: '',
        contactName: '',
        email: '',
        phone: '',
        product: '',
        nfcLink: '',
        quantity: '',
        deadline: '',
        notes: '',
      });
    } catch (error) {
      const statusCode = (error as Error & { status?: number }).status;
      setStatus({
        type: 'error',
        message:
          statusCode === 401
            ? 'Authentication required. Please log in with Cognito.'
            : 'Unable to submit right now. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ py: { xs: 6, md: 10 } }}>
      <Container maxWidth="lg">
        <Stack spacing={2} sx={{ mb: 6 }}>
          <Chip label="Custom order intake" sx={{ width: 'fit-content', bgcolor: '#EAF4FF' }} />
          <Typography variant="h2">Tell us what you want to build</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 640 }}>
            Share your product, quantities, and how you want the NFC experience to work.
            We will follow up with design questions and a proof for approval.
          </Typography>
        </Stack>

        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 7 }}>
            <Stack spacing={2}>
              <TextField
                label="Business or project name"
                fullWidth
                value={form.businessName}
                onChange={handleChange('businessName')}
              />
              <TextField
                label="Primary contact"
                fullWidth
                value={form.contactName}
                onChange={handleChange('contactName')}
              />
              <TextField
                label="Email"
                type="email"
                fullWidth
                value={form.email}
                onChange={handleChange('email')}
              />
              <TextField
                label="Phone (optional)"
                fullWidth
                value={form.phone}
                onChange={handleChange('phone')}
              />
              <TextField
                label="What are you selling or promoting?"
                multiline
                minRows={3}
                fullWidth
                value={form.product}
                onChange={handleChange('product')}
              />
              <TextField
                label="What should the NFC link to?"
                placeholder="Menu, reorder page, Instagram, etc."
                fullWidth
                value={form.nfcLink}
                onChange={handleChange('nfcLink')}
              />
              <TextField
                label="Estimated quantity"
                fullWidth
                value={form.quantity}
                onChange={handleChange('quantity')}
              />
              <TextField
                label="Deadline or event date (optional)"
                fullWidth
                value={form.deadline}
                onChange={handleChange('deadline')}
              />
              <TextField
                label="Notes, materials, or inspiration"
                multiline
                minRows={4}
                fullWidth
                value={form.notes}
                onChange={handleChange('notes')}
              />
              {status && <Alert severity={status.type}>{status.message}</Alert>}
              <Button
                variant="contained"
                size="large"
                sx={{ alignSelf: 'flex-start' }}
                onClick={handleSubmit}
                disabled={submitting}
              >
                Submit request
              </Button>
            </Stack>
          </Grid>
          <Grid size={{ xs: 12, md: 5 }}>
            <Box
              sx={{
                p: 3,
                borderRadius: 3,
                border: '1px solid #C5D6E5',
                backgroundColor: '#F4F8FB',
              }}
            >
              <Typography variant="h4" sx={{ mb: 2 }}>
                What happens next
              </Typography>
              <Stack spacing={2}>
                <Typography variant="body2" color="text.secondary">
                  1. We review your request and follow up within 1-2 business days.
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  2. You receive a design proof and NFC flow recommendation.
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  3. You approve, we produce, and you track progress from your Orders page.
                </Typography>
              </Stack>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
