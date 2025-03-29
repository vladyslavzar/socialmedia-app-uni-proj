import { useState, useRef, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  Container,
  FormControl,
  FormHelperText,
  Divider,
  LinearProgress,
  Card,
  CardMedia,
  Fade,
  Tooltip,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import ErrorDisplay from '../components/ErrorDisplay';
import { postService } from '../services/api';
import { useAuth } from '../contexts/useAuth';
import { Post } from '../types';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import LoadingSpinner from '../components/LoadingSpinner';

const EditPost = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [post, setPost] = useState<Post | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [newImage, setNewImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Fetch post data
  useEffect(() => {
    const fetchPostData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        setGeneralError(null);
        
        const postData = await postService.getPost(parseInt(id));
        setPost(postData);
        
        // Check if the current user is the author
        if (!currentUser || currentUser.id !== postData.author.id) {
          setUnauthorized(true);
          return;
        }
        
        // Initialize form fields
        setTitle(postData.title);
        setContent(postData.content);
        if (postData.image) {
          setCurrentImage(postData.image);
          setImagePreview(postData.image);
        }
      } catch (err) {
        console.error('Error fetching post:', err);
        setGeneralError('Failed to load post data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPostData();
  }, [id, currentUser]);
  
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
      
      setNewImage(selectedFile);
      setCurrentImage(null);
      setImagePreview(URL.createObjectURL(selectedFile));
      
      // Clear any previous error
      const newErrors = {...errors};
      delete newErrors.image;
      setErrors(newErrors);
    }
  };
  
  const handleRemoveImage = () => {
    setNewImage(null);
    setCurrentImage(null);
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
    
    if (!validate() || !post) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      setGeneralError(null);
      
      // Create a FormData instance to handle file upload
      const formData = new FormData();
      formData.append('title', title);
      formData.append('content', content);
      
      // Only append image if there's a new one
      if (newImage) {
        formData.append('image', newImage);
      } else if (currentImage === null) {
        // If currentImage is null and newImage is null, it means the user removed the image
        formData.append('remove_image', 'true');
      }
      
      await postService.updatePost(post.id, formData);
      
      // Navigate back to the post detail page
      navigate(`/posts/${post.id}`);
    } catch (err: unknown) {
      console.error('Error updating post:', err);
      
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
            setGeneralError('Failed to update post. Please try again.');
          }
        }
      } else if (error.request) {
        setGeneralError('No response from server. Please check your connection.');
      } else {
        setGeneralError('Failed to update post. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleCancel = () => {
    // Check if there are changes
    if (
      post && 
      (title !== post.title || 
      content !== post.content || 
      (post.image && !currentImage) || 
      (!post.image && (newImage || currentImage)) ||
      newImage)
    ) {
      setOpenConfirmDialog(true);
    } else {
      navigate(`/posts/${id}`);
    }
  };
  
  if (loading) {
    return (
      <Layout title="Loading...">
        <Box sx={{ py: 5 }}>
          <LoadingSpinner message="Loading post data..." />
        </Box>
      </Layout>
    );
  }
  
  if (unauthorized) {
    return (
      <Layout title="Unauthorized">
        <Container maxWidth="md" sx={{ py: 5 }}>
          <Alert 
            severity="error" 
            variant="filled"
            sx={{ mb: 3 }}
          >
            You don't have permission to edit this post
          </Alert>
          <Button 
            variant="contained" 
            onClick={() => navigate(`/posts/${id}`)}
          >
            Back to Post
          </Button>
        </Container>
      </Layout>
    );
  }
  
  if (!post) {
    return (
      <Layout title="Error">
        <Container maxWidth="md" sx={{ py: 5 }}>
          <ErrorDisplay error="Post not found" />
          <Button 
            variant="contained" 
            onClick={() => navigate('/')}
            sx={{ mt: 2 }}
          >
            Back to Home
          </Button>
        </Container>
      </Layout>
    );
  }
  
  return (
    <Layout title="Edit Post">
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
                Edit Post
              </Typography>
              <Tooltip title="Update your post" arrow>
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
                    mb: 3,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1.5
                    }
                  }}
                />
                
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
                    mb: 3,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1.5
                    }
                  }}
                />
                
                <Divider sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    MEDIA
                  </Typography>
                </Divider>
                
                <FormControl error={!!errors.image} fullWidth sx={{ mb: 3 }}>
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
                      <Tooltip title="Change image" arrow>
                        <Button
                          variant="outlined"
                          component="span"
                          startIcon={<PhotoCameraIcon />}
                          disabled={isSubmitting}
                          sx={{ borderRadius: 2 }}
                        >
                          {imagePreview ? 'Change Image' : 'Add Image'}
                        </Button>
                      </Tooltip>
                    </label>
                    {imagePreview && (
                      <Tooltip title="Remove image" arrow>
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
                      </Tooltip>
                    )}
                  </Box>
                  {errors.image && (
                    <FormHelperText error>{errors.image}</FormHelperText>
                  )}
                </FormControl>
                
                {imagePreview && (
                  <Fade in={!!imagePreview} timeout={500}>
                    <Card sx={{ 
                      maxWidth: '100%', 
                      mb: 3,
                      borderRadius: 2,
                      overflow: 'hidden',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}>
                      <CardMedia
                        component="img"
                        image={imagePreview}
                        alt="Preview"
                        sx={{ 
                          maxHeight: 400,
                          width: '100%',
                          objectFit: 'contain'
                        }}
                      />
                    </Card>
                  </Fade>
                )}
                
                <Divider sx={{ mb: 3 }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    type="button"
                    variant="outlined"
                    onClick={handleCancel}
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
                    endIcon={<SaveIcon />}
                    sx={{ 
                      px: 3, 
                      py: 1, 
                      borderRadius: 2,
                      background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                      boxShadow: '0 3px 10px rgba(66, 165, 245, 0.3)',
                    }}
                  >
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </Button>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Fade>
      </Container>
      
      {/* Discard Changes Confirmation Dialog */}
      <Dialog
        open={openConfirmDialog}
        onClose={() => setOpenConfirmDialog(false)}
      >
        <DialogTitle>Discard Changes?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You have unsaved changes. Are you sure you want to leave this page? All changes will be lost.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirmDialog(false)}>
            Stay on Page
          </Button>
          <Button 
            onClick={() => navigate(`/posts/${id}`)} 
            color="error" 
            variant="contained"
          >
            Discard Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
};

export default EditPost; 