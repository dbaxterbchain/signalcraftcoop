import {
  AppBar,
  Box,
  Button,
  Container,
  Drawer,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material';
import AccountCircle from '@mui/icons-material/AccountCircle';
import MenuIcon from '@mui/icons-material/Menu';
import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { loginWithHostedUI, logout } from '../auth/auth';
import useAuth from '../auth/useAuth';

export default function NavBar() {
  const [open, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { isAuthenticated } = useAuth();

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ py: 1 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ flexGrow: 1 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background:
                  'radial-gradient(70% 70% at 30% 30%, #52B9FF 0%, #1677C8 45%, #0A2A43 100%)',
              }}
            />
            <Typography variant="h4" color="text.primary">
              Signalcraft Coop
            </Typography>
          </Stack>
          <Stack direction="row" spacing={2} sx={{ display: { xs: 'none', md: 'flex' } }}>
            <Button component={RouterLink} to="/" sx={{ color: 'text.primary' }}>
              Home
            </Button>
            <Button component={RouterLink} to="/products" sx={{ color: 'text.primary' }}>
              Products
            </Button>
            <Button component={RouterLink} to="/custom-order" sx={{ color: 'text.primary' }}>
              Custom Orders
            </Button>
          </Stack>
          <Stack direction="row" spacing={1} sx={{ ml: 2, display: { xs: 'none', md: 'flex' } }}>
            <Button variant="outlined">Contact</Button>
            <Button variant="contained">Start a custom order</Button>
            {isAuthenticated ? (
              <>
                <IconButton
                  onClick={(event) => setAnchorEl(event.currentTarget)}
                  sx={{ ml: 1 }}
                  aria-label="User menu"
                >
                  <AccountCircle />
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={() => setAnchorEl(null)}
                >
                  <MenuItem component={RouterLink} to="/orders" onClick={() => setAnchorEl(null)}>
                    Orders
                  </MenuItem>
                  <MenuItem disabled>Account</MenuItem>
                  <MenuItem
                    onClick={() => {
                      setAnchorEl(null);
                      void logout();
                    }}
                  >
                    Log out
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <Button variant="text" onClick={() => loginWithHostedUI(window.location.pathname)}>
                Log in
              </Button>
            )}
          </Stack>
          <IconButton
            onClick={() => setOpen(true)}
            sx={{ display: { xs: 'inline-flex', md: 'none' }, ml: 1 }}
            aria-label="Open menu"
          >
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </Container>
      <Drawer anchor="right" open={open} onClose={() => setOpen(false)}>
        <Box sx={{ width: 260, p: 3 }}>
          <Stack spacing={2}>
            <Button component={RouterLink} to="/" onClick={() => setOpen(false)}>
              Home
            </Button>
            <Button component={RouterLink} to="/products" onClick={() => setOpen(false)}>
              Products
            </Button>
            <Button component={RouterLink} to="/custom-order" onClick={() => setOpen(false)}>
              Custom Orders
            </Button>
            <Button variant="outlined" onClick={() => setOpen(false)}>
              Contact
            </Button>
            <Button variant="contained" onClick={() => setOpen(false)}>
              Start a custom order
            </Button>
            {isAuthenticated ? (
              <Button
                onClick={() => {
                  setOpen(false);
                  void logout();
                }}
              >
                Log out
              </Button>
            ) : (
              <Button
                onClick={() => {
                  setOpen(false);
                  loginWithHostedUI(window.location.pathname);
                }}
              >
                Log in
              </Button>
            )}
          </Stack>
        </Box>
      </Drawer>
    </AppBar>
  );
}
