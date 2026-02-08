import { Box, Card, CardActionArea, CardContent, Container, Grid, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const cards = [
  { title: 'Orders', description: 'Manage custom and store orders.', to: '/admin/orders' },
  { title: 'Products', description: 'Add, edit, and deactivate products.', to: '/admin/products' },
  { title: 'Messages', description: 'Read and respond to contact form messages.', to: '/admin/messages' },
];

export default function AdminDashboardPage() {
  return (
    <Box sx={{ py: { xs: 6, md: 10 } }}>
      <Container maxWidth="lg">
        <Stack spacing={2} sx={{ mb: 4 }}>
          <Typography variant="h2">Admin dashboard</Typography>
          <Typography variant="body1" color="text.secondary">
            Manage orders, products, and customer messages.
          </Typography>
        </Stack>
        <Grid container spacing={3}>
          {cards.map((card) => (
            <Grid size={{ xs: 12, md: 4 }} key={card.title}>
              <Card sx={{ height: '100%' }}>
                <CardActionArea component={RouterLink} to={card.to} sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h4" sx={{ mb: 1 }}>
                      {card.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {card.description}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
