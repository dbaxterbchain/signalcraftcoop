import {
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Stack,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { Link as RouterLink } from 'react-router-dom';
import HeroIllustration from '../components/HeroIllustration';

const features = [
  {
    title: 'Custom NFC-Embedded Merch',
    body: 'Keychains, tags, and small goods that instantly connect customers to the next action.',
  },
  {
    title: 'Bespoke Displays & Containers',
    body: 'Branded stands and holders that turn impulse products into repeat orders.',
  },
  {
    title: 'Screen Print + Embroidery',
    body: 'Co-op friendly production runs with quality, consistency, and fast turnaround.',
  },
];

const useCases = [
  'Coffee shop cookie vendors',
  'Artist merch tables',
  'Game stores and trinket trades',
  'Non-profits and community orgs',
];

export default function HomePage() {
  return (
    <Box>
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          background:
            'linear-gradient(135deg, rgba(10,42,67,0.96) 0%, rgba(17,68,100,0.92) 40%, rgba(22,119,200,0.78) 100%)',
          color: '#F4F8FB',
          pb: { xs: 8, md: 12 },
          pt: { xs: 6, md: 10 },
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            opacity: 0.2,
            background:
              'radial-gradient(60% 60% at 10% 20%, #52B9FF 0%, transparent 60%), radial-gradient(40% 40% at 80% 30%, #1677C8 0%, transparent 70%)',
          }}
        />
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Grid container spacing={6} alignItems="center">
            <Grid size={{ xs: 12, md: 6 }}>
              <Stack spacing={4}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip
                    label="Signalcraft Coop"
                    color="primary"
                    sx={{
                      bgcolor: 'rgba(82,185,255,0.2)',
                      color: '#EAF4FF',
                      border: '1px solid rgba(82,185,255,0.4)',
                    }}
                  />
                  <Chip
                    label="Custom NFC + Merch"
                    sx={{
                      bgcolor: 'rgba(244,248,251,0.12)',
                      color: '#EAF4FF',
                    }}
                  />
                </Stack>
                <Typography variant="h1" sx={{ maxWidth: 640 }}>
                  Make your products reorderable, memorable, and unmistakably yours.
                </Typography>
                <Typography variant="h5" sx={{ maxWidth: 560, color: '#C5D6E5' }}>
                  Signalcraft Coop builds custom displays, NFC-enhanced merchandise, and
                  branded goods for cooperatives, small businesses, artists, and local
                  vendors.
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <Button
                    component={RouterLink}
                    to="/custom-order"
                    variant="contained"
                    size="large"
                    sx={{
                      background:
                        'linear-gradient(120deg, #52B9FF 0%, #1677C8 60%, #0A2A43 120%)',
                      boxShadow: '0 12px 32px rgba(22, 119, 200, 0.35)',
                    }}
                  >
                    Start a custom order
                  </Button>
                  <Button
                    component={RouterLink}
                    to="/products"
                    variant="outlined"
                    size="large"
                    sx={{ borderColor: '#EAF4FF', color: '#EAF4FF' }}
                  >
                    View standard products
                  </Button>
                </Stack>
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Stack spacing={3}>
                <HeroIllustration />
                <Box>
                  <Typography variant="h3" sx={{ mb: 2 }}>
                    NFC enabled experiences
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#C5D6E5', mb: 3 }}>
                    Tap-enabled stands and keychains send customers to your menu, shop,
                    reorder flow, or next event. Every item becomes a repeat order engine.
                  </Typography>
                  <Stack spacing={1.5}>
                    {useCases.map((item) => (
                      <Box
                        key={item}
                        sx={{
                          px: 2,
                          py: 1,
                          borderRadius: 999,
                          border: '1px solid rgba(234,244,255,0.2)',
                          bgcolor: 'rgba(234,244,255,0.08)',
                        }}
                      >
                        <Typography variant="body2">{item}</Typography>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              </Stack>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ mt: { xs: 6, md: 10 } }}>
        <Grid container spacing={3}>
          {features.map((feature) => (
            <Grid size={{ xs: 12, md: 4 }} key={feature.title}>
              <Box
                sx={{
                  p: 3,
                  borderRadius: 3,
                  border: '1px solid #C5D6E5',
                  backgroundColor: '#FFFFFF',
                  boxShadow: '0 6px 24px rgba(10, 42, 67, 0.12)',
                  height: '100%',
                  transition: 'transform 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                  },
                }}
              >
                <Typography variant="h4" sx={{ mb: 1 }}>
                  {feature.title}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {feature.body}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>

        <Divider sx={{ my: { xs: 6, md: 8 } }} />

        <Grid container spacing={4} alignItems="center">
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="h2" sx={{ mb: 2 }}>
              Designed for local commerce
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              From cookie brands in coffee shops to artist merch tables, our custom
              displays and NFC-enabled products turn impulse buys into repeat orders.
            </Typography>
            <Stack spacing={2}>
              {['Submit your concept', 'Design + NFC flow', 'Approve + launch'].map(
                (step, index) => (
                  <Stack direction="row" spacing={2} alignItems="center" key={step}>
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        bgcolor: '#EAF4FF',
                        color: '#1677C8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 600,
                      }}
                    >
                      {index + 1}
                    </Box>
                    <Typography variant="body1">{step}</Typography>
                  </Stack>
                ),
              )}
            </Stack>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Box
              sx={{
                p: 4,
                borderRadius: 4,
                background:
                  'radial-gradient(120% 120% at 0% 0%, #52B9FF 0%, #EAF4FF 45%, #FFFFFF 80%)',
                border: '1px solid #C5D6E5',
              }}
            >
              <Typography variant="h3" sx={{ mb: 2 }}>
                Built for reorders
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Tap-enabled stands and keychains route customers back to your shop,
                your menu, or your reorder link instantly.
              </Typography>
              <Button component={RouterLink} to="/custom-order" variant="contained">
                Discuss your concept
              </Button>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: { xs: 6, md: 8 } }} />

        <Box sx={{ textAlign: 'center', pb: { xs: 6, md: 10 } }}>
          <Typography variant="h2" sx={{ mb: 2 }}>
            Ready to craft your signal?
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Share your product line and we will design the right display, merch, and
            NFC experience to keep customers coming back.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            <Button component={RouterLink} to="/custom-order" variant="contained" size="large">
              Start a custom order
            </Button>
            <Button component={RouterLink} to="/products" variant="outlined" size="large">
              Browse the store
            </Button>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}
