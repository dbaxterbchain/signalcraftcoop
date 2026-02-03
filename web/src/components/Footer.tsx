import { Box, Container, Divider, Stack, Typography } from '@mui/material';

export default function Footer() {
  return (
    <Box sx={{ bgcolor: '#0A2A43', color: '#EAF4FF', mt: 10 }}>
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} justifyContent="space-between">
          <Box>
            <Typography variant="h4" sx={{ mb: 1, color: '#FFFFFF' }}>
              Signalcraft Coop
            </Typography>
            <Typography variant="body2" sx={{ color: '#C5D6E5', maxWidth: 320 }}>
              Custom NFC merch, displays, and apparel for co-ops and small businesses.
              Built for local commerce, repeat orders, and lasting brand presence.
            </Typography>
          </Box>
          <Stack spacing={1}>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              Contact
            </Typography>
            <Typography variant="body2" sx={{ color: '#C5D6E5' }}>
              hello@signalcraft.coop
            </Typography>
            <Typography variant="body2" sx={{ color: '#C5D6E5' }}>
              Portland, OR
            </Typography>
          </Stack>
          <Stack spacing={1}>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              Services
            </Typography>
            <Typography variant="body2" sx={{ color: '#C5D6E5' }}>
              Custom orders
            </Typography>
            <Typography variant="body2" sx={{ color: '#C5D6E5' }}>
              NFC integration
            </Typography>
            <Typography variant="body2" sx={{ color: '#C5D6E5' }}>
              Apparel + engraving
            </Typography>
          </Stack>
        </Stack>
        <Divider sx={{ my: 4, borderColor: 'rgba(234, 244, 255, 0.2)' }} />
        <Typography variant="body2" sx={{ color: '#C5D6E5' }}>
          Co-op values. Local production. Built with care.
        </Typography>
      </Container>
    </Box>
  );
}
