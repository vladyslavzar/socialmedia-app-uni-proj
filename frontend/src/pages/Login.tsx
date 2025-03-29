import { useState } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  Container,
  Link,
  LinearProgress
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';
import Layout from '../components/Layout';
import ErrorDisplay from '../components/ErrorDisplay';

// Define API error interface
interface ApiError {
  message?: string;
  response?: {
    status?: number;
    data?: {
      detail?: string;
      non_field_errors?: string[];
    }
  };
  request?: unknown;
}

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple validation
    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Call login method from auth context
      await login(username, password);
      
      // Immediately redirect to home page after successful login
      navigate('/');
      
    } catch (err) {
      // Cast to API error type for better error handling
      const apiError = err as ApiError;
      
      // Determine the most appropriate error message
      if (apiError.response?.data?.detail) {
        setError(apiError.response.data.detail);
      } else if (apiError.response?.data?.non_field_errors?.[0]) {
        setError(apiError.response.data.non_field_errors[0]);
      } else if (apiError.response?.status === 401) {
        setError('Invalid username or password');
      } else if (apiError.message) {
        setError(apiError.message);
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Layout title="Login">
      <Container component="main" maxWidth="xs">
        <Paper 
          elevation={3} 
          sx={{ 
            mt: 8, 
            p: 4, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {isSubmitting && (
            <LinearProgress
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '4px'
              }}
            />
          )}
          
          <Typography component="h1" variant="h5" sx={{ mb: 2 }}>
            Log In
          </Typography>
          
          <ErrorDisplay error={error} />
          
          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Username"
              name="username"
              autoComplete="username"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isSubmitting}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              sx={{ mt: 3, mb: 2 }}
              disabled={isSubmitting || !username || !password}
            >
              {isSubmitting ? 'Logging in...' : 'Log In'}
            </Button>
            
            <Box sx={{ textAlign: 'center' }}>
              <Link component={RouterLink} to="/register" variant="body2">
                {"Don't have an account? Sign up"}
              </Link>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Layout>
  );
};

export default Login; 