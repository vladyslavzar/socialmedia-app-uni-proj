import { ReactNode } from 'react';
import { 
  AppBar, 
  Box, 
  Toolbar, 
  Typography, 
  Button, 
  Container, 
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  useTheme
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';
import { useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import LogoutIcon from '@mui/icons-material/Logout';

interface LayoutProps {
  children: ReactNode;
  title?: string;
}

const Layout = ({ children, title = 'Social Media App' }: LayoutProps) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const theme = useTheme();
  
  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleLogout = () => {
    logout();
    handleMenuClose();
    navigate('/login');
  };
  
  const handleCreatePost = () => {
    navigate('/posts/create');
  };
  
  const handleProfile = () => {
    navigate('/profile');
    handleMenuClose();
  };
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar 
        position="static" 
        elevation={0}
        sx={{
          backgroundColor: 'background.paper',
          borderBottom: `1px solid ${theme.palette.divider}`
        }}
      >
        <Toolbar>
          <Typography 
            variant="h6" 
            component={RouterLink} 
            to="/" 
            sx={{ 
              flexGrow: 1, 
              textDecoration: 'none', 
              color: 'inherit',
              fontWeight: 700
            }}
          >
            {title}
          </Typography>
          
          {currentUser ? (
            <>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleCreatePost}
                sx={{ mr: 2 }}
              >
                New Post
              </Button>
              
              <IconButton
                edge="end"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleProfileMenuOpen}
                color="inherit"
              >
                {currentUser?.profile?.profile_picture ? (
                  <Avatar 
                    alt={currentUser.username}
                    src={currentUser.profile.profile_picture}
                    sx={{ 
                      width: 40, 
                      height: 40,
                      border: `2px solid ${theme.palette.primary.main}`
                    }}
                  />
                ) : (
                  <Avatar sx={{ 
                    bgcolor: theme.palette.primary.main,
                    width: 40, 
                    height: 40
                  }}>
                    {currentUser.username.charAt(0).toUpperCase()}
                  </Avatar>
                )}
              </IconButton>
              
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                keepMounted
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                PaperProps={{
                  elevation: 3,
                  sx: {
                    mt: 1.5,
                    borderRadius: 2,
                    minWidth: 180
                  }
                }}
              >
                <MenuItem onClick={handleProfile}>Profile</MenuItem>
                <MenuItem onClick={handleLogout}>
                  <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
                  Logout
                </MenuItem>
              </Menu>
            </>
          ) : (
            <>
              <Button 
                color="primary" 
                component={RouterLink} 
                to="/login"
                variant="outlined"
                sx={{ mr: 1 }}
              >
                Login
              </Button>
              <Button 
                color="primary" 
                component={RouterLink} 
                to="/register"
                variant="contained"
              >
                Register
              </Button>
            </>
          )}
        </Toolbar>
      </AppBar>
      
      <Container component="main" sx={{ flexGrow: 1, py: 3 }}>
        {children}
      </Container>
      
      <Box 
        component="footer" 
        sx={{ 
          py: 3, 
          px: 2, 
          mt: 'auto', 
          backgroundColor: 'background.paper',
          borderTop: `1px solid ${theme.palette.divider}`
        }}
      >
        <Container maxWidth="sm">
          <Typography variant="body2" color="text.secondary" align="center">
            © {new Date().getFullYear()} Social Media App
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default Layout; 