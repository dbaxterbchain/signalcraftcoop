import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { createCustomerUploadUrl } from '../api/client';
import type { Product } from '../api/types';
import { useCart } from '../cart/CartContext';

const makeId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `cart-${Date.now()}-${Math.random().toString(16).slice(2)}`;

type AddToCartDialogProps = {
  open: boolean;
  product: Product | null;
  onClose: () => void;
};

export default function AddToCartDialog({ open, product, onClose }: AddToCartDialogProps) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [nfcUrl, setNfcUrl] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setQuantity(1);
    setNfcUrl('');
    setLogoFile(null);
    setError(null);
  };

  const handleClose = () => {
    if (!submitting) {
      resetForm();
      onClose();
    }
  };

  const handleSubmit = async () => {
    if (!product) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      let logoUrl: string | undefined;
      let logoFileName: string | undefined;

      if (logoFile) {
        const contentType = logoFile.type || 'application/octet-stream';
        const { uploadUrl, fileUrl } = await createCustomerUploadUrl({
          fileName: logoFile.name,
          contentType,
          category: 'logo',
        });
        const response = await fetch(uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': contentType },
          body: logoFile,
        });
        if (!response.ok) {
          throw new Error('Logo upload failed.');
        }
        logoUrl = fileUrl;
        logoFileName = logoFile.name;
      }

      addItem({
        id: makeId(),
        productId: product.id,
        title: product.title,
        sku: product.sku,
        unitPrice: product.basePrice ?? 0,
        quantity: Math.max(1, quantity),
        nfcUrl: product.allowsNfc ? nfcUrl.trim() || undefined : undefined,
        logoUrl,
        logoFileName,
      });

      resetForm();
      onClose();
    } catch (err) {
      setError((err as Error).message || 'Unable to add item to cart.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add to cart</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {product?.title}
          </Typography>
          <TextField
            label="Quantity"
            type="number"
            value={quantity}
            onChange={(event) => setQuantity(Number(event.target.value))}
            inputProps={{ min: 1 }}
          />
          {product?.allowsNfc && (
            <TextField
              label="NFC link"
              placeholder="https://..."
              value={nfcUrl}
              onChange={(event) => setNfcUrl(event.target.value)}
            />
          )}
          {product?.allowsLogoUpload && (
            <Stack spacing={1}>
              <Button variant="outlined" component="label">
                {logoFile ? 'Replace logo file' : 'Upload logo file'}
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(event) =>
                    setLogoFile(event.target.files?.[0] ?? null)
                  }
                />
              </Button>
              {logoFile && (
                <Typography variant="caption" color="text.secondary">
                  Selected: {logoFile.name}
                </Typography>
              )}
            </Stack>
          )}
          {error && <Alert severity="info">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={submitting}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Adding...' : 'Add to cart'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
