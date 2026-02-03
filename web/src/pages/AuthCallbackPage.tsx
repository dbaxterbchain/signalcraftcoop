import { Box, CircularProgress, Container, Typography } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { clearReturnTo, getReturnTo, handleAuthCallback } from '../auth/auth';

export default function AuthCallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const didHandleRef = useRef(false);

  useEffect(() => {
    if (didHandleRef.current) {
      return;
    }
    didHandleRef.current = true;

    const code = params.get('code');
    const errorMessage = params.get('error_description') ?? params.get('error');

    if (errorMessage) {
      setError(errorMessage);
      return;
    }

    if (!code) {
      setError('Missing authorization code.');
      return;
    }

    handleAuthCallback(code)
      .then(() => {
        const returnTo = getReturnTo();
        clearReturnTo();
        navigate(returnTo, { replace: true });
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Login failed');
      });
  }, [navigate, params]);

  return (
    <Box sx={{ py: { xs: 6, md: 10 } }}>
      <Container maxWidth="sm" sx={{ textAlign: 'center' }}>
        {error ? (
          <>
            <Typography variant="h4" sx={{ mb: 2 }}>
              Sign-in failed
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {error}
            </Typography>
          </>
        ) : (
          <>
            <CircularProgress sx={{ mb: 2 }} />
            <Typography variant="body1" color="text.secondary">
              Finishing sign-in...
            </Typography>
          </>
        )}
      </Container>
    </Box>
  );
}
