import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Avatar, 
  Button, 
  TextField, 
  IconButton,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress
} from '@mui/material';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/useAuth';
import { User } from '../types';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';

const Profile = () => {
  const { currentUser, updateProfile, loading: authLoading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<User>>({
    first_name: '',
    last_name: '',
  });
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setFormData({
        first_name: currentUser.first_name || '',
        last_name: currentUser.last_name || '',
      });
      
      // Safely access profile
      if (currentUser.profile) {
        setPreviewUrl(currentUser.profile.profile_picture);
      }
    }
  }, [currentUser]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePicture(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    
    // Reset form data safely
    if (currentUser) {
      setFormData({
        first_name: currentUser.first_name || '',
        last_name: currentUser.last_name || '',
      });
      setProfilePicture(null);
      
      // Safely access profile
      if (currentUser.profile) {
        setPreviewUrl(currentUser.profile.profile_picture);
      }
    }
    
    setError(null);
    setSuccess(null);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const formDataToSend = new FormData();
      formDataToSend.append('first_name', formData.first_name || '');
      formDataToSend.append('last_name', formData.last_name || '');
      
      if (profilePicture) {
        formDataToSend.append('profile_picture', profilePicture);
      } else if (!previewUrl) {
        // If no preview URL and no new picture, it means we want to remove the picture
        formDataToSend.append('profile_picture', '');
      }

      await updateProfile(formDataToSend);
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
    } catch (err: unknown) {
      console.error('Profile update error:', err);
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePicture = () => {
    setProfilePicture(null);
    setPreviewUrl(null);
    setOpenDialog(false);
  };

  // Show loading state while auth data is being fetched
  if (authLoading) {
    return (
      <Layout>
        <Box sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  // Handle case when user is not logged in
  if (!currentUser) {
    return (
      <Layout>
        <Box sx={{ py: 4 }}>
          <Typography variant="h4" gutterBottom>
            Profile
          </Typography>
          <Typography>
            Please log in to view your profile.
          </Typography>
        </Box>
      </Layout>
    );
  }

  // Create a safe profile object to avoid "Cannot read properties of undefined"
  const safeProfile = currentUser.profile || {
    bio: '',
    profile_picture: null,
    date_joined: new Date().toISOString()
  };
  
  // Format join date safely
  const joinDate = safeProfile.date_joined 
    ? new Date(safeProfile.date_joined).toLocaleDateString() 
    : 'Unknown';
  
  return (
    <Layout>
      <Box sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4 }}>
            {/* Profile Picture Section */}
            <Box sx={{ textAlign: 'center', flex: { md: '0 0 250px' } }}>
              <Box sx={{ position: 'relative', display: 'inline-block' }}>
                <Avatar
                  src={previewUrl || undefined}
                  alt={`${currentUser.first_name} ${currentUser.last_name}`}
                  sx={{ 
                    width: 200, 
                    height: 200, 
                    mb: 2,
                    border: '4px solid #fff',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                >
                  {currentUser.username.charAt(0).toUpperCase()}
                </Avatar>
                
                {isEditing && (
                  <>
                    <input
                      accept="image/*"
                      style={{ display: 'none' }}
                      id="profile-picture-input"
                      type="file"
                      onChange={handleProfilePictureChange}
                    />
                    <label htmlFor="profile-picture-input">
                      <IconButton
                        color="primary"
                        component="span"
                        sx={{
                          position: 'absolute',
                          bottom: 0,
                          right: 0,
                          backgroundColor: 'white',
                          '&:hover': {
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                          },
                        }}
                      >
                        <PhotoCameraIcon />
                      </IconButton>
                    </label>
                    {previewUrl && (
                      <Button
                        color="error"
                        onClick={() => setOpenDialog(true)}
                        sx={{ mt: 1 }}
                      >
                        Remove Picture
                      </Button>
                    )}
                  </>
                )}
              </Box>
            </Box>

            {/* Profile Information Section */}
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" gutterBottom>
                  Profile Information
                </Typography>
                {!isEditing ? (
                  <Button
                    startIcon={<EditIcon />}
                    onClick={handleEdit}
                    variant="outlined"
                  >
                    Edit Profile
                  </Button>
                ) : (
                  <Box>
                    <Button
                      startIcon={<CancelIcon />}
                      onClick={handleCancel}
                      sx={{ mr: 1 }}
                    >
                      Cancel
                    </Button>
                    <Button
                      startIcon={<SaveIcon />}
                      onClick={handleSave}
                      variant="contained"
                      disabled={loading}
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </Box>
                )}
              </Box>

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              {success && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  {success}
                </Alert>
              )}

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <TextField
                  sx={{ flex: '1 1 45%', minWidth: '200px' }}
                  label="First Name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                />
                <TextField
                  sx={{ flex: '1 1 45%', minWidth: '200px' }}
                  label="Last Name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                />
                <TextField
                  sx={{ flex: '1 1 100%' }}
                  label="Username"
                  value={currentUser.username}
                  disabled
                />
                <TextField
                  sx={{ flex: '1 1 100%' }}
                  label="Email"
                  value={currentUser.email || 'Not provided'}
                  disabled
                />
              </Box>

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" gutterBottom>
                Account Information
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Member since: {joinDate}
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* Delete Profile Picture Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Remove Profile Picture</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to remove your profile picture?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleDeletePicture} color="error">
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
};

export default Profile; 