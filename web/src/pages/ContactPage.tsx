import { Alert, Box, Button, Chip, Container, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { submitContactMessage } from '../api/client';

export default function ContactPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);
    try {
      await submitContactMessage({
        name: form.name.trim(),
        email: form.email.trim(),
        subject: form.subject.trim() || undefined,
        message: form.message.trim(),
      });
      setSuccess(true);
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch {
      setError('Unable to send your message right now.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ py: { xs: 6, md: 10 } }}>
      <Container maxWidth="md">
        <Stack spacing={2} sx={{ mb: 4 }}>
          <Chip label="Contact" sx={{ width: 'fit-content', bgcolor: '#EAF4FF' }} />
          <Typography variant="h2">Send us a message</Typography>
          <Typography variant="body1" color="text.secondary">
            Ask a question, request a quote, or share feedback. We usually respond within 1-2 business days.
          </Typography>
        </Stack>
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            p: 4,
            borderRadius: 3,
            border: '1px solid #C5D6E5',
            backgroundColor: '#FFFFFF',
          }}
        >
          <Stack spacing={3}>
            <TextField
              label="Name"
              value={form.name}
              onChange={handleChange('name')}
              required
              fullWidth
            />
            <TextField
              label="Email"
              value={form.email}
              onChange={handleChange('email')}
              type="email"
              required
              fullWidth
            />
            <TextField
              label="Subject"
              value={form.subject}
              onChange={handleChange('subject')}
              fullWidth
            />
            <TextField
              label="Message"
              value={form.message}
              onChange={handleChange('message')}
              required
              multiline
              minRows={4}
              fullWidth
            />
            {success && <Alert severity="success">Message sent. We'll be in touch soon.</Alert>}
            {error && <Alert severity="info">{error}</Alert>}
            <Button type="submit" variant="contained" disabled={submitting}>
              {submitting ? 'Sending...' : 'Send message'}
            </Button>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}
