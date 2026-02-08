import {
  Alert,
  Box,
  Button,
  Container,
  Stack,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { useEffect, useState } from 'react';
import { getContactMessages, updateContactMessage } from '../../api/client';
import type { ContactMessage } from '../../api/types';

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getContactMessages()
      .then((data) => {
        if (active) {
          setMessages(data);
        }
      })
      .catch(() => {
        if (active) {
          setError('Unable to load messages.');
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const handleToggleStatus = async (message: ContactMessage) => {
    setUpdatingId(message.id);
    setError(null);
    try {
      const updated = await updateContactMessage(message.id, {
        status: message.status === 'open' ? 'closed' : 'open',
      });
      setMessages((prev) =>
        prev.map((item) => (item.id === message.id ? updated : item)),
      );
    } catch {
      setError('Unable to update message status.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <Box sx={{ py: { xs: 6, md: 10 } }}>
      <Container maxWidth="lg">
        <Stack spacing={2} sx={{ mb: 4 }}>
          <Typography variant="h2">Contact messages</Typography>
          <Typography variant="body1" color="text.secondary">
            Review customer inquiries and mark them resolved.
          </Typography>
          {error && <Alert severity="info">{error}</Alert>}
        </Stack>
        <Grid container spacing={3}>
          {messages.map((message) => (
            <Grid size={{ xs: 12, md: 6 }} key={message.id}>
              <Box
                sx={{
                  p: 3,
                  borderRadius: 3,
                  border: '1px solid #C5D6E5',
                  backgroundColor: '#FFFFFF',
                }}
              >
                <Stack spacing={1}>
                  <Typography variant="h4">{message.subject ?? 'Message'}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    From: {message.name} ({message.email})
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Status: {message.status}
                  </Typography>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {message.message}
                  </Typography>
                  <Button
                    variant="outlined"
                    onClick={() => handleToggleStatus(message)}
                    disabled={updatingId === message.id}
                    sx={{ alignSelf: 'flex-start' }}
                  >
                    {updatingId === message.id
                      ? 'Updating...'
                      : message.status === 'open'
                        ? 'Mark closed'
                        : 'Reopen'}
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
