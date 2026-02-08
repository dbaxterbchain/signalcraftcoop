import {
  Alert,
  Box,
  Button,
  Checkbox,
  Container,
  FormControlLabel,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { useEffect, useState } from 'react';
import {
  createProduct,
  deactivateProduct,
  createUploadUrl,
  getAdminProducts,
  updateProduct,
} from '../../api/client';
import type { Product, ProductImage } from '../../api/types';

const blankProduct = {
  title: '',
  sku: '',
  description: '',
  basePrice: 0,
  category: '',
  allowsNfc: false,
  allowsLogoUpload: false,
  images: [] as ProductImage[],
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Partial<Product>>>({});
  const [createForm, setCreateForm] = useState(blankProduct);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [uploadingCreate, setUploadingCreate] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getAdminProducts()
      .then((data) => {
        if (active) {
          setProducts(data);
        }
      })
      .catch(() => {
        if (active) {
          setError('Unable to load products.');
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const updateDraft = (
    id: string,
    field: keyof Product,
    value: string | number | boolean,
  ) => {
    setDrafts((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: field === 'basePrice' ? Number(value) : value,
      },
    }));
  };

  const normalizeImages = (images: ProductImage[]) => {
    if (images.length === 0) {
      return images;
    }
    const mainIndex = images.findIndex((image) => image.isMain);
    if (mainIndex === -1) {
      return images.map((image, index) => ({
        ...image,
        isMain: index === 0,
      }));
    }
    return images.map((image, index) => ({
      ...image,
      isMain: index === mainIndex,
    }));
  };

  const uploadFiles = async (files: FileList) => {
    const uploads = await Promise.all(
      Array.from(files).map(async (file) => {
        const contentType = file.type || 'application/octet-stream';
        const { uploadUrl, fileUrl } = await createUploadUrl({
          fileName: file.name,
          contentType,
          category: 'product',
        });
        await fetch(uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': contentType },
          body: file,
        });
        return {
          url: fileUrl,
          isMain: false,
        } as ProductImage;
      }),
    );
    return uploads;
  };

  const handleCreateImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) {
      return;
    }
    setUploadingCreate(true);
    setError(null);
    try {
      const uploads = await uploadFiles(files);
      setCreateForm((prev) => ({
        ...prev,
        images: normalizeImages([...(prev.images ?? []), ...uploads]),
      }));
    } catch {
      setError('Unable to upload product images.');
    } finally {
      setUploadingCreate(false);
    }
  };

  const handleDraftImageUpload = async (
    product: Product,
    files: FileList | null,
  ) => {
    if (!files || files.length === 0) {
      return;
    }
    setUploadingId(product.id);
    setError(null);
    try {
      const uploads = await uploadFiles(files);
      const currentImages = (drafts[product.id]?.images ??
        product.images ??
        []) as ProductImage[];
      const nextImages = normalizeImages([...currentImages, ...uploads]);
      setDrafts((prev) => ({
        ...prev,
        [product.id]: {
          ...prev[product.id],
          images: nextImages,
        },
      }));
    } catch {
      setError('Unable to upload product images.');
    } finally {
      setUploadingId(null);
    }
  };

  const handleRemoveImage = (productId: string, index: number) => {
    const currentImages =
      (drafts[productId]?.images as ProductImage[] | undefined) ?? [];
    const nextImages = normalizeImages(
      currentImages.filter((_, imageIndex) => imageIndex !== index),
    );
    setDrafts((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        images: nextImages,
      },
    }));
  };

  const handleSetMainImage = (productId: string, index: number) => {
    const currentImages =
      (drafts[productId]?.images as ProductImage[] | undefined) ?? [];
    const nextImages = currentImages.map((image, imageIndex) => ({
      ...image,
      isMain: imageIndex === index,
    }));
    setDrafts((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        images: nextImages,
      },
    }));
  };

  const handleCreate = async () => {
    setCreating(true);
    setError(null);
    try {
      const created = await createProduct({
        title: createForm.title,
        sku: createForm.sku,
        description: createForm.description,
        basePrice: Number(createForm.basePrice),
        category: createForm.category,
        allowsNfc: createForm.allowsNfc,
        allowsLogoUpload: createForm.allowsLogoUpload,
        images: normalizeImages(createForm.images).map((image, index) => ({
          ...image,
          sortOrder: index,
        })),
      });
      setProducts((prev) => [created, ...prev]);
      setCreateForm(blankProduct);
    } catch {
      setError('Unable to create product.');
    } finally {
      setCreating(false);
    }
  };

  const handleSave = async (product: Product) => {
    const draft = drafts[product.id];
    if (!draft) {
      return;
    }
    setSavingId(product.id);
    setError(null);
    try {
      const payload = { ...draft };
      if (draft.images) {
        payload.images = normalizeImages(draft.images).map((image, index) => ({
          ...image,
          sortOrder: index,
        }));
      }
      const updated = await updateProduct(product.id, payload);
      setProducts((prev) =>
        prev.map((item) => (item.id === product.id ? updated : item)),
      );
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[product.id];
        return next;
      });
    } catch {
      setError('Unable to update product.');
    } finally {
      setSavingId(null);
    }
  };

  const handleToggleActive = async (product: Product) => {
    setSavingId(product.id);
    setError(null);
    try {
      const updated = product.active
        ? await deactivateProduct(product.id)
        : await updateProduct(product.id, { active: true });
      setProducts((prev) =>
        prev.map((item) => (item.id === product.id ? updated : item)),
      );
    } catch {
      setError('Unable to deactivate product.');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <Box sx={{ py: { xs: 6, md: 10 } }}>
      <Container maxWidth="lg">
        <Stack spacing={2} sx={{ mb: 4 }}>
          <Typography variant="h2">Products</Typography>
          <Typography variant="body1" color="text.secondary">
            Create new products and manage inventory visibility.
          </Typography>
          {error && <Alert severity="info">{error}</Alert>}
        </Stack>

        <Box
          sx={{
            p: 3,
            borderRadius: 3,
            border: '1px solid #C5D6E5',
            backgroundColor: '#FFFFFF',
            mb: 4,
          }}
        >
          <Typography variant="h4" sx={{ mb: 2 }}>
            Add a product
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Title"
                value={createForm.title}
                onChange={(event) =>
                  setCreateForm((prev) => ({ ...prev, title: event.target.value }))
                }
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="SKU"
                value={createForm.sku}
                onChange={(event) =>
                  setCreateForm((prev) => ({ ...prev, sku: event.target.value }))
                }
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Base price"
                type="number"
                value={createForm.basePrice}
                onChange={(event) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    basePrice: Number(event.target.value),
                  }))
                }
                fullWidth
              />
            </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              label="Category"
              value={createForm.category}
                onChange={(event) =>
                  setCreateForm((prev) => ({ ...prev, category: event.target.value }))
                }
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={Boolean(createForm.allowsNfc)}
                    onChange={(event) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        allowsNfc: event.target.checked,
                      }))
                    }
                  />
                }
                label="Allows NFC"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={Boolean(createForm.allowsLogoUpload)}
                    onChange={(event) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        allowsLogoUpload: event.target.checked,
                      }))
                    }
                  />
                }
                label="Allows logo upload"
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Description"
                value={createForm.description}
                onChange={(event) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
                fullWidth
                multiline
                minRows={3}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Stack spacing={2}>
                <Button
                  variant="outlined"
                  component="label"
                  disabled={uploadingCreate}
                >
                  {uploadingCreate ? 'Uploading images...' : 'Upload product images'}
                  <input
                    type="file"
                    hidden
                    multiple
                    accept="image/*"
                    onChange={(event) =>
                      handleCreateImageUpload(event.target.files)
                    }
                  />
                </Button>
                <Stack spacing={1}>
                  {createForm.images.map((image, index) => (
                    <Stack
                      key={`${image.url}-${index}`}
                      direction="row"
                      spacing={2}
                      alignItems="center"
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
                          border: '1px solid #C5D6E5',
                        }}
                      />
                      <Stack direction="row" spacing={1}>
                        <Button
                          variant={image.isMain ? 'contained' : 'outlined'}
                          onClick={() =>
                            setCreateForm((prev) => ({
                              ...prev,
                              images: normalizeImages(
                                prev.images.map((item, itemIndex) => ({
                                  ...item,
                                  isMain: itemIndex === index,
                                })),
                              ),
                            }))
                          }
                        >
                          {image.isMain ? 'Main image' : 'Set main'}
                        </Button>
                        <Button
                          color="error"
                          variant="text"
                          onClick={() =>
                            setCreateForm((prev) => ({
                              ...prev,
                              images: normalizeImages(
                                prev.images.filter((_, itemIndex) => itemIndex !== index),
                              ),
                            }))
                          }
                        >
                          Remove
                        </Button>
                      </Stack>
                    </Stack>
                  ))}
                </Stack>
              </Stack>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Button variant="contained" onClick={handleCreate} disabled={creating}>
                {creating ? 'Creating...' : 'Create product'}
              </Button>
            </Grid>
          </Grid>
        </Box>

        <Grid container spacing={3}>
          {products.map((product) => {
            const draft = drafts[product.id] ?? {};
            const isSaving = savingId === product.id;
            const currentImages = (draft.images ??
              product.images ??
              []) as ProductImage[];
            return (
              <Grid size={{ xs: 12, md: 6 }} key={product.id}>
                <Box
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    border: '1px solid #C5D6E5',
                    backgroundColor: '#FFFFFF',
                  }}
                >
                  <Stack spacing={2}>
                    <TextField
                      label="Title"
                      value={draft.title ?? product.title ?? ''}
                      onChange={(event) => updateDraft(product.id, 'title', event.target.value)}
                      fullWidth
                    />
                    <TextField
                      label="SKU"
                      value={draft.sku ?? product.sku ?? ''}
                      onChange={(event) => updateDraft(product.id, 'sku', event.target.value)}
                      fullWidth
                    />
                    <TextField
                      label="Base price"
                      type="number"
                      value={draft.basePrice ?? product.basePrice ?? 0}
                      onChange={(event) => updateDraft(product.id, 'basePrice', event.target.value)}
                      fullWidth
                    />
                    <TextField
                      label="Category"
                      value={draft.category ?? product.category ?? ''}
                      onChange={(event) => updateDraft(product.id, 'category', event.target.value)}
                      fullWidth
                    />
                    <TextField
                      label="Description"
                      value={draft.description ?? product.description ?? ''}
                      onChange={(event) => updateDraft(product.id, 'description', event.target.value)}
                      fullWidth
                      multiline
                      minRows={2}
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={Boolean(draft.allowsNfc ?? product.allowsNfc)}
                          onChange={(event) =>
                            updateDraft(product.id, 'allowsNfc', event.target.checked)
                          }
                        />
                      }
                      label="Allows NFC"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={Boolean(
                            draft.allowsLogoUpload ?? product.allowsLogoUpload,
                          )}
                          onChange={(event) =>
                            updateDraft(
                              product.id,
                              'allowsLogoUpload',
                              event.target.checked,
                            )
                          }
                        />
                      }
                      label="Allows logo upload"
                    />
                    <Stack spacing={2}>
                      <Button
                        variant="outlined"
                        component="label"
                        disabled={uploadingId === product.id}
                      >
                        {uploadingId === product.id
                          ? 'Uploading images...'
                          : 'Upload more images'}
                        <input
                          type="file"
                          hidden
                          multiple
                          accept="image/*"
                          onChange={(event) =>
                            handleDraftImageUpload(product, event.target.files)
                          }
                        />
                      </Button>
                      <Stack spacing={1}>
                        {currentImages.map((image, index) => (
                          <Stack
                            key={`${image.url}-${index}`}
                            direction="row"
                            spacing={2}
                            alignItems="center"
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
                                border: '1px solid #C5D6E5',
                              }}
                            />
                            <Stack direction="row" spacing={1}>
                              <Button
                                variant={image.isMain ? 'contained' : 'outlined'}
                                onClick={() => handleSetMainImage(product.id, index)}
                              >
                                {image.isMain ? 'Main image' : 'Set main'}
                              </Button>
                              <Button
                                color="error"
                                variant="text"
                                onClick={() => handleRemoveImage(product.id, index)}
                              >
                                Remove
                              </Button>
                            </Stack>
                          </Stack>
                        ))}
                      </Stack>
                    </Stack>
                    <Stack direction="row" spacing={2}>
                      <Button
                        variant="outlined"
                        onClick={() => handleSave(product)}
                        disabled={isSaving}
                      >
                        {isSaving ? 'Saving...' : 'Save'}
                      </Button>
                      <Button
                        variant="text"
                        color={product.active ? 'error' : 'primary'}
                        onClick={() => handleToggleActive(product)}
                        disabled={isSaving}
                      >
                        {product.active ? 'Deactivate' : 'Reactivate'}
                      </Button>
                    </Stack>
                  </Stack>
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </Container>
    </Box>
  );
}
