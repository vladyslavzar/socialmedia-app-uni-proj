import { useState, useRef } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  Container,
  FormControl,
  InputLabel,
  FormHelperText,
  Grid,
  LinearProgress,
  Card,
  CardMedia,
  Divider,
  Fade,
  Tooltip,
  Zoom
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import ErrorDisplay from '../components/ErrorDisplay';
import { postService } from '../services/api';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import DeleteIcon from '@mui/icons-material/Delete';
import SendIcon from '@mui/icons-material/Send';
import CancelIcon from '@mui/icons-material/Cancel';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';

const CreatePost = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Validate file size (limit to 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setErrors({
          ...errors,
          image: 'Image size should be less than 5MB'
        });
        return;
      }
      
      // Validate file type
      if (!selectedFile.type.startsWith('image/')) {
        setErrors({
          ...errors,
          image: 'Please select an image file'
        });
        return;
      }
      
      setImage(selectedFile);
      setImagePreview(URL.createObjectURL(selectedFile));
      
      // Clear any previous error
      const newErrors = {...errors};
      delete newErrors.image;
      setErrors(newErrors);
    }
  };
  
  const handleRemoveImage = () => {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    if (errors.title) {
      const newErrors = {...errors};
      delete newErrors.title;
      setErrors(newErrors);
    }
  };
  
  const handleContentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContent(e.target.value);
    if (errors.content) {
      const newErrors = {...errors};
      delete newErrors.content;
      setErrors(newErrors);
    }
  };
  
  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!title) {
      newErrors.title = 'Title is required';
    } else if (title.length > 200) {
      newErrors.title = 'Title must be less than 200 characters';
    }
    
    if (!content) {
      newErrors.content = 'Content is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      setGeneralError(null);
      
      // Create a FormData instance to handle file upload
      const formData = new FormData();
      formData.append('title', title);
      formData.append('content', content);
      if (image) {
        formData.append('image', image);
      }
      
      const response = await postService.createPost(formData);
      
      // Navigate to the new post
      navigate(`/posts/${response.id}`);
    } catch (err: unknown) {
      console.error('Error creating post:', err);
      
      const error = err as { response?: any; request?: any };
      
      if (error.response) {
        if (error.response.status === 500) {
          setGeneralError('Server error. Please try again later.');
        } else if (error.response.data) {
          // Handle API validation errors
          const apiErrors = error.response.data;
          
          const fieldErrors: Record<string, string> = {};
          Object.entries(apiErrors).forEach(([key, value]) => {
            if (Array.isArray(value)) {
              fieldErrors[key] = value[0] as string;
            } else if (typeof value === 'string') {
              fieldErrors[key] = value as string;
            }
          });
          
          if (Object.keys(fieldErrors).length > 0) {
            setErrors(fieldErrors);
          } else {
            setGeneralError('Failed to create post. Please try again.');
          }
        }
      } else if (error.request) {
        setGeneralError('No response from server. Please check your connection.');
      } else {
        setGeneralError('Failed to create post. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Layout title="Create Post">
      <Container maxWidth="md">
        <Fade in={true} timeout={800}>
          <Paper
            elevation={3}
            sx={{
              mt: 4,
              p: 0,
              position: 'relative',
              overflow: 'hidden',
              borderRadius: 2,
              boxShadow: '0 8px 40px rgba(0,0,0,0.12)'
            }}
          >
            <Box sx={{ 
              bgcolor: 'primary.main', 
              py: 2, 
              px: 3,
              color: 'white',
              display: 'flex',
              alignItems: 'center'
            }}>
              <Typography variant="h5" component="h1" fontWeight="500">
                Create New Post
              </Typography>
              <Tooltip title="Share your story with the world" arrow>
                <TipsAndUpdatesIcon sx={{ ml: 2, opacity: 0.8 }} />
              </Tooltip>
            </Box>
            
            {isSubmitting && (
              <LinearProgress
                sx={{
                  height: '4px'
                }}
              />
            )}
            
            <Box sx={{ p: 4 }}>
              <ErrorDisplay error={generalError} fieldErrors={errors} />
              
              <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      label="Title"
                      variant="outlined"
                      fullWidth
                      required
                      value={title}
                      onChange={handleTitleChange}
                      error={!!errors.title}
                      helperText={errors.title}
                      disabled={isSubmitting}
                      inputProps={{ maxLength: 200 }}
                      placeholder="An interesting title..."
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1.5
                        }
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      label="Content"
                      variant="outlined"
                      fullWidth
                      required
                      multiline
                      minRows={6}
                      maxRows={12}
                      value={content}
                      onChange={handleContentChange}
                      error={!!errors.content}
                      helperText={errors.content}
                      disabled={isSubmitting}
                      placeholder="Share your thoughts here..."
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1.5
                        }
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Divider sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        MEDIA
                      </Typography>
                    </Divider>
                    
                    <FormControl error={!!errors.image} fullWidth>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <input
                          accept="image/*"
                          id="image-upload"
                          type="file"
                          onChange={handleImageChange}
                          style={{ display: 'none' }}
                          ref={fileInputRef}
                          disabled={isSubmitting}
                        />
                        <label htmlFor="image-upload">
                          <Tooltip title="Add an image to your post" arrow>
                            <Button
                              variant="outlined"
                              component="span"
                              startIcon={<PhotoCameraIcon />}
                              disabled={isSubmitting}
                              sx={{ borderRadius: 2 }}
                            >
                              Upload Image
                            </Button>
                          </Tooltip>
                        </label>
                        {image && (
                          <Zoom in={true}>
                            <Button
                              variant="text"
                              color="error"
                              onClick={handleRemoveImage}
                              sx={{ ml: 2, borderRadius: 2 }}
                              startIcon={<DeleteIcon />}
                              disabled={isSubmitting}
                            >
                              Remove
                            </Button>
                          </Zoom>
                        )}
                      </Box>
                      {errors.image && (
                        <FormHelperText error>{errors.image}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>
                  
                  {imagePreview && (
                    <Grid item xs={12}>
                      <Zoom in={!!imagePreview} style={{ transitionDelay: '100ms' }}>
                        <Card sx={{ 
                          maxWidth: 500, 
                          mx: 'auto', 
                          mt: 1,
                          borderRadius: 2,
                          overflow: 'hidden',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}>
                          <CardMedia
                            component="img"
                            image={imagePreview}
                            alt="Image preview"
                            sx={{ maxHeight: 300, objectFit: 'contain' }}
                          />
                        </Card>
                      </Zoom>
                    </Grid>
                  )}
                  
                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                      <Button
                        type="button"
                        variant="outlined"
                        onClick={() => navigate('/')}
                        sx={{ mr: 2, borderRadius: 2 }}
                        disabled={isSubmitting}
                        startIcon={<CancelIcon />}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="contained"
                        disabled={isSubmitting}
                        endIcon={<SendIcon />}
                        sx={{ 
                          px: 3, 
                          py: 1, 
                          borderRadius: 2,
                          background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                          boxShadow: '0 3px 10px rgba(66, 165, 245, 0.3)',
                        }}
                      >
                        {isSubmitting ? 'Creating Post...' : 'Create Post'}
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          </Paper>
        </Fade>
      </Container>
    </Layout>
  );
};

export default CreatePost; 