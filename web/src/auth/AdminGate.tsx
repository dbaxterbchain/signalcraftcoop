import { Box, Button, CircularProgress, Typography } from '@mui/material';
import { loginWithHostedUI } from './auth';
import useAuth from './useAuth';

type AdminGateProps = {
  children: React.ReactNode;
};

export default function AdminGate({ children }: AdminGateProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const isAdmin = user?.groups?.includes('admin') ?? false;

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
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
          Admin sign-in required
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Log in with an admin account to access the dashboard.
        </Typography>
        <Button variant="contained" onClick={() => loginWithHostedUI(window.location.pathname)}>
          Log in
        </Button>
      </Box>
    );
  }

  if (!isAdmin) {
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
          Admin access required
        </Typography>
        <Typography variant="body1" color="text.secondary">
          This account does not have admin permissions.
        </Typography>
      </Box>
    );
  }

  return <>{children}</>;
}
