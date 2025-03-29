import { Alert, AlertTitle, Box } from '@mui/material';

interface ErrorDisplayProps {
  error: string | null;
  fieldErrors?: Record<string, string>;
}

const ErrorDisplay = ({ error, fieldErrors = {} }: ErrorDisplayProps) => {
  const hasFieldErrors = Object.keys(fieldErrors).length > 0;
  
  if (!error && !hasFieldErrors) return null;
  
  return (
    <Box sx={{ width: '100%', mb: 2 }}>
      {error && (
        <Alert severity="error" sx={{ mb: hasFieldErrors ? 2 : 0 }}>
          <AlertTitle>Error</AlertTitle>
          {error}
        </Alert>
      )}
      
      {hasFieldErrors && (
        <Alert severity="warning">
          <AlertTitle>Validation Issues</AlertTitle>
          <ul style={{ paddingLeft: '20px', margin: '8px 0 0' }}>
            {Object.entries(fieldErrors).map(([field, message]) => (
              <li key={field}>{`${field}: ${message}`}</li>
            ))}
          </ul>
        </Alert>
      )}
    </Box>
  );
};

export default ErrorDisplay; 