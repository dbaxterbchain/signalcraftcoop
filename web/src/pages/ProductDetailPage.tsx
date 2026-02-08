import { Alert, Box, Button, Chip, Container, Stack, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import AddToCartDialog from '../components/AddToCartDialog';
import { getProduct } from '../api/client';
import type { Product, ProductImage } from '../api/types';

const sortImages = (images: ProductImage[]) =>
  [...images].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

const getMainIndex = (images: ProductImage[]) => {
  const index = images.findIndex((image) => image.isMain);
  return index === -1 ? 0 : index;
};

export default function ProductDetailPage() {
  const { productId } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);

  const images = useMemo(() => sortImages(product?.images ?? []), [product?.images]);

  useEffect(() => {
    if (!productId) {
      setError('Missing product id.');
      return;
    }
    let active = true;
    getProduct(productId)
      .then((data) => {
        if (!active) {
          return;
        }
        setProduct(data);
        setActiveIndex(getMainIndex(data.images ?? []));
      })
      .catch(() => {
        if (active) {
          setError('Unable to load product details.');
        }
      });
    return () => {
      active = false;
    };
  }, [productId]);

  const activeImage = images[activeIndex];

  return (
    <Box sx={{ py: { xs: 6, md: 10 } }}>
      <Container maxWidth="lg">
        <Stack spacing={2} sx={{ mb: 4 }}>
          <Chip label="Product detail" sx={{ width: 'fit-content', bgcolor: '#EAF4FF' }} />
          <Typography variant="h2">{product?.title ?? 'Product'}</Typography>
          {product?.description && (
            <Typography variant="body1" color="text.secondary">
              {product.description}
            </Typography>
          )}
          {error && <Alert severity="info">{error}</Alert>}
          <Button
            component={RouterLink}
            to="/products"
            variant="text"
            sx={{ alignSelf: 'flex-start' }}
          >
            Back to products
          </Button>
        </Stack>

        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 7 }}>
            <Box
              sx={{
                borderRadius: 3,
                border: '1px solid #C5D6E5',
                backgroundColor: '#FFFFFF',
                p: 2,
              }}
            >
              <Box
                sx={{
                  width: '100%',
                  height: { xs: 260, md: 420 },
                  borderRadius: 2,
                  border: '1px solid #E0E7EF',
                  backgroundColor: '#F4F8FB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                {activeImage ? (
                  <Box
                    component="img"
                    src={activeImage.url}
                    alt={activeImage.altText ?? product?.title ?? 'Product image'}
                    sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Product images coming soon.
                  </Typography>
                )}
              </Box>

              {images.length > 1 && (
                <Stack spacing={2} sx={{ mt: 2 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => setActiveIndex((prev) => Math.max(prev - 1, 0))}
                      disabled={activeIndex === 0}
                    >
                      Prev
                    </Button>
                    <Typography variant="caption" color="text.secondary">
                      {activeIndex + 1} / {images.length}
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() =>
                        setActiveIndex((prev) => Math.min(prev + 1, images.length - 1))
                      }
                      disabled={activeIndex === images.length - 1}
                    >
                      Next
                    </Button>
                  </Stack>
                  <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                    {images.map((image, index) => (
                      <Box
                        key={`${image.url}-${index}`}
                        component="button"
                        type="button"
                        onClick={() => setActiveIndex(index)}
                        sx={{
                          p: 0,
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer',
                        }}
                      >
                        <Box
                          component="img"
                          src={image.url}
                          alt={image.altText ?? `Product image ${index + 1}`}
                          sx={{
                            width: 72,
                            height: 72,
                            borderRadius: 2,
                            objectFit: 'cover',
                            border: index === activeIndex ? '2px solid #1677C8' : '1px solid #C5D6E5',
                          }}
                        />
                      </Box>
                    ))}
                  </Stack>
                </Stack>
              )}
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 5 }}>
            <Box
              sx={{
                p: 3,
                borderRadius: 3,
                border: '1px solid #C5D6E5',
                backgroundColor: '#FFFFFF',
                height: '100%',
              }}
            >
              <Stack spacing={2}>
                <Typography variant="h4">{product?.title ?? 'Product details'}</Typography>
                {product?.sku && (
                  <Typography variant="body2" color="text.secondary">
                    SKU: {product.sku}
                  </Typography>
                )}
                {product?.basePrice !== undefined && (
                  <Typography variant="h5">${product.basePrice.toFixed(2)}</Typography>
                )}
                {product?.category && (
                  <Typography variant="body2" color="text.secondary">
                    Category: {product.category}
                  </Typography>
                )}
                {product?.allowsNfc !== undefined && (
                  <Typography variant="body2" color="text.secondary">
                    NFC ready: {product.allowsNfc ? 'Yes' : 'No'}
                  </Typography>
                )}
                {product ? (
                  <Button
                    variant="contained"
                    onClick={() => setDialogOpen(true)}
                    sx={{ alignSelf: 'flex-start' }}
                  >
                    Add to cart
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    component={RouterLink}
                    to="/contact"
                    sx={{ alignSelf: 'flex-start' }}
                  >
                    Request details
                  </Button>
                )}
              </Stack>
            </Box>
          </Grid>
        </Grid>
      </Container>
      <AddToCartDialog
        open={dialogOpen}
        product={product}
        onClose={() => setDialogOpen(false)}
      />
    </Box>
  );
}
