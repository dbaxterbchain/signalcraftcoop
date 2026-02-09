import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Container,
  Stack,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import AddToCartDialog from '../components/AddToCartDialog';
import { getProducts } from '../api/client';
import type { Product } from '../api/types';

const fallbackProducts: Product[] = [
  {
    id: 'prod_fallback_1',
    title: 'Logo Keychains (NFC)',
    sku: 'KEY-NFC-01',
    description: 'Durable acrylic keychains with embedded NFC.',
  },
  {
    id: 'prod_fallback_2',
    title: 'Laser-Engraved Coasters',
    sku: 'COASTER-ENG-01',
    description: 'Set of 4 coasters with crisp engraving.',
  },
  {
    id: 'prod_fallback_3',
    title: 'Branded Display Stand',
    sku: 'DISPLAY-CUSTOM',
    description: 'Countertop stand designed for impulse purchases.',
  },
  {
    id: 'prod_fallback_4',
    title: 'Custom Container',
    sku: 'CONTAINER-CUSTOM',
    description: 'Fits your product, your brand, and a reorder tap.',
  },
];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const navigate = useNavigate();

  const getMainImage = (product: Product) => {
    const images = product.images ?? [];
    return images.find((image) => image.isMain) ?? images[0];
  };

  useEffect(() => {
    let active = true;
    getProducts()
      .then((data) => {
        if (active) {
          setProducts(data);
        }
      })
      .catch(() => {
        if (active) {
          setError('Showing placeholder products. API connection not available yet.');
          setProducts(fallbackProducts);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <Box sx={{ py: { xs: 6, md: 10 } }}>
      <Container maxWidth="lg">
        <Stack spacing={2} sx={{ mb: 6 }}>
          <Chip
            label="Standard products"
            sx={{ width: 'fit-content', bgcolor: '#EAF4FF', color: '#1677C8' }}
          />
          <Typography variant="h2">Ready-to-order merch + displays</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 620 }}>
            These are starting points. Each item can be customized with your logo,
            materials, and optional NFC programming.
          </Typography>
          {error && <Alert severity="info">{error}</Alert>}
        </Stack>

        <Grid container spacing={3}>
          {products.map((product) => {
            const mainImage = getMainImage(product);
            const isFallback = product.id.startsWith('prod_fallback_');
            const detailsLink = isFallback ? '/contact' : `/products/${product.id}`;
            return (
              <Grid size={{ xs: 12, md: 6 }} key={product.id}>
                <Card
                  sx={{
                    borderRadius: 3,
                    border: '1px solid #C5D6E5',
                    backgroundColor: '#FFFFFF',
                    boxShadow: '0 6px 24px rgba(10, 42, 67, 0.12)',
                    height: '100%',
                  }}
                >
                <CardActionArea
                  onClick={() => navigate(detailsLink)}
                  sx={{ height: '100%', alignItems: 'stretch' }}
                >
                    <CardContent
                      sx={{
                        p: 3,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                      }}
                    >
                      <Box
                        sx={{
                          width: '100%',
                          height: 200,
                          borderRadius: 2,
                          border: '1px solid #E0E7EF',
                          backgroundColor: '#F4F8FB',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                        }}
                      >
                        {mainImage ? (
                          <Box
                            component="img"
                            src={mainImage.url}
                            alt={mainImage.altText ?? product.title}
                            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Product image coming soon.
                          </Typography>
                        )}
                      </Box>
                      <Typography variant="h4">{product.title}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {product.description}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        SKU: {product.sku}
                      </Typography>
                      <Stack direction="row" spacing={2} sx={{ mt: 'auto' }}>
                        <Button
                          variant="outlined"
                          onClick={(event) => {
                            event.stopPropagation();
                            navigate(detailsLink);
                          }}
                        >
                          {isFallback ? 'Request details' : 'View details'}
                        </Button>
                        {!isFallback && (
                          <Button
                            variant="contained"
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              setSelectedProduct(product);
                              setDialogOpen(true);
                            }}
                          >
                            Add to cart
                          </Button>
                        )}
                      </Stack>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        <Box
          sx={{
            mt: 8,
            p: { xs: 3, md: 4 },
            borderRadius: 4,
            background: 'linear-gradient(135deg, #0A2A43 0%, #1677C8 100%)',
            color: '#FFFFFF',
          }}
        >
          <Grid container spacing={3} alignItems="center">
            <Grid size={{ xs: 12, md: 8 }}>
              <Typography variant="h3" sx={{ mb: 1 }}>
                Need something custom?
              </Typography>
              <Typography variant="body1" sx={{ color: '#C5D6E5' }}>
                We design containers, stands, and NFC-integrated products tailored to
                your exact product line.
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
              <Button component={RouterLink} to="/custom-order" variant="contained">
                Start a custom order
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Container>
      <AddToCartDialog
        open={dialogOpen}
        product={selectedProduct}
        onClose={() => setDialogOpen(false)}
      />
    </Box>
  );
}
