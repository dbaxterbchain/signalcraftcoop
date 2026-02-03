import { Box, Button, CircularProgress, Typography } from '@mui/material';
import { loginWithHostedUI } from './auth';
import useAuth from './useAuth';

type AuthGateProps = {
  children: React.ReactNode;
};

export default function AuthGate({ children }: AuthGateProps) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <Box
      sx={{
        p: 4,
        borderRadius: 3,
        border: '1px dashed #C5D6E5',
        textAlign: 'center',
        backgroundColor: '#F4F8FB',
      }}
    >
      <Typography variant="h4" sx={{ mb: 1 }}>
        Sign in required
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Log in to access your orders and design reviews.
      </Typography>
      <Button variant="contained" onClick={() => loginWithHostedUI(window.location.pathname)}>
        Log in with Cognito
      </Button>
    </Box>
  );
}
