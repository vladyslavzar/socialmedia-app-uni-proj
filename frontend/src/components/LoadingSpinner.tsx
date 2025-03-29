import { Box, CircularProgress, Typography } from '@mui/material';

interface LoadingSpinnerProps {
  message?: string;
  fullScreen?: boolean;
}

const LoadingSpinner = ({ 
  message = 'Loading...', 
  fullScreen = false 
}: LoadingSpinnerProps) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: fullScreen ? '100vh' : '200px',
        width: '100%',
      }}
    >
      <CircularProgress size={60} thickness={4} color="primary" />
      {message && (
        <Typography 
          variant="body1" 
          color="text.secondary" 
          sx={{ mt: 2, fontWeight: 500 }}
        >
          {message}
        </Typography>
      )}
    </Box>
  );
};

export default LoadingSpinner; 