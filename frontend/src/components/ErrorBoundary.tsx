import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Paper, Button, Alert } from '@mui/material';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({
      error,
      errorInfo
    });
    
    // Log error to console for debugging
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '50vh', 
          p: 3 
        }}>
          <Paper elevation={3} sx={{ p: 4, maxWidth: 600, width: '100%' }}>
            <Alert severity="error" sx={{ mb: 2 }}>
              An error has occurred in the application
            </Alert>
            
            <Typography variant="h5" component="h2" gutterBottom>
              Something went wrong
            </Typography>
            
            <Typography variant="body1" color="text.secondary" paragraph>
              {this.state.error?.toString()}
            </Typography>
            
            <Box sx={{ mt: 2 }}>
              <Button 
                variant="contained" 
                onClick={() => window.location.reload()}
              >
                Reload Page
              </Button>
            </Box>
            
            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <Box sx={{ mt: 4 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Error Details (Development Only):
                </Typography>
                <Paper 
                  sx={{ 
                    p: 2, 
                    bgcolor: 'grey.100', 
                    maxHeight: 200, 
                    overflow: 'auto',
                    fontFamily: 'monospace',
                    fontSize: '0.875rem'
                  }}
                >
                  <pre>{this.state.errorInfo.componentStack}</pre>
                </Paper>
              </Box>
            )}
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 