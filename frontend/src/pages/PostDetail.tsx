import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardMedia, 
  CardContent, 
  Avatar,
  Button,
  IconButton,
  TextField,
  Paper,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Collapse,
  Fade,
  Skeleton
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { postService, commentService } from '../services/api';
import { Post } from '../types';
import { useAuth } from '../contexts/useAuth';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CommentIcon from '@mui/icons-material/Comment';
import SendIcon from '@mui/icons-material/Send';
import ErrorDisplay from '../components/ErrorDisplay';
import { formatDistanceToNow } from 'date-fns';
import axios from 'axios';

const PostDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // Fetch post data
  useEffect(() => {
    const fetchPostData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!id) return;
        
        const postData = await postService.getPost(parseInt(id));
        setPost(postData);
      } catch {
        setError('Failed to load post. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPostData();
  }, [id]);
  
  // Like/unlike post
  const handleLikeToggle = async () => {
    if (!post) return;
    
    if (!currentUser) {
      setError('Please log in to like posts');
      return;
    }
    
    try {
      if (post.is_liked) {
        await postService.unlikePost(post.id);
        setPost({
          ...post,
          is_liked: false,
          likes_count: post.likes_count - 1
        });
      } else {
        await postService.likePost(post.id);
        setPost({
          ...post,
          is_liked: true,
          likes_count: post.likes_count + 1
        });
      }
    } catch (error) {
      // Check for specific error types
      if (axios.isAxiosError(error) && error.response) {
        if (error.response.status === 401) {
          setError('Please log in to like posts');
        } else if (error.response.status === 403) {
          setError('You do not have permission to like posts. Please log in again.');
          // The user will need to log in again
          localStorage.removeItem('token');
          navigate('/login');
        } else {
          setError('Failed to update like status. Please try again.');
        }
      } else {
        setError('Failed to connect to the server. Please check your connection.');
      }
    }
  };
  
  // Add new comment
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim() || !post) {
      return;
    }
    
    if (!currentUser) {
      setCommentError('Please log in to add a comment');
      return;
    }
    
    try {
      setSubmittingComment(true);
      setCommentError(null);
      
      const commentData = {
        post: post.id,
        content: newComment.trim()
      };
      
      const createdComment = await commentService.createComment(commentData);
      
      // Add new comment to the post
      setPost({
        ...post,
        comments: [...post.comments, createdComment]
      });
      
      // Clear comment input
      setNewComment('');
    } catch (error) {
      // Check for specific error types
      if (axios.isAxiosError(error) && error.response) {
        if (error.response.status === 401) {
          setCommentError('Please log in to add a comment');
        } else if (error.response.status === 403) {
          setCommentError('You do not have permission to add a comment. Please log in again.');
          // The user will need to log in again
          localStorage.removeItem('token');
          navigate('/login');
        } else {
          setCommentError('Failed to add comment. Please try again.');
        }
      } else {
        setCommentError('Failed to connect to the server. Please check your connection.');
      }
    } finally {
      setSubmittingComment(false);
    }
  };
  
  // Delete post
  const handleDeletePost = async () => {
    if (!post || !currentUser) return;
    
    try {
      setDeleting(true);
      await postService.deletePost(post.id);
      setOpenDeleteDialog(false);
      navigate('/');
    } catch {
      setError('Failed to delete post. Please try again.');
      setDeleting(false);
      setOpenDeleteDialog(false);
    }
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return dateString;
    }
  };
  
  if (loading) {
    return (
      <Layout title="Loading Post...">
        <Box sx={{ py: 4, maxWidth: 800, mx: 'auto' }}>
          <Skeleton variant="rectangular" width="100%" height={60} sx={{ mb: 2, borderRadius: 1 }} />
          <Skeleton variant="rectangular" width="30%" height={30} sx={{ mb: 1 }} />
          <Skeleton variant="rectangular" width="100%" height={400} sx={{ mb: 2, borderRadius: 1 }} />
          <Skeleton variant="rectangular" width="100%" height={100} sx={{ borderRadius: 1 }} />
        </Box>
      </Layout>
    );
  }
  
  if (error || !post) {
    return (
      <Layout title="Error">
        <Box sx={{ py: 4, maxWidth: 800, mx: 'auto' }}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <ErrorDisplay error={error || 'Post not found'} />
            <Button 
              variant="outlined" 
              onClick={() => navigate('/')}
              sx={{ mt: 2 }}
            >
              Back to Home
            </Button>
          </Paper>
        </Box>
      </Layout>
    );
  }
  
  const isAuthor = currentUser && post.author.id === currentUser.id;
  
  return (
    <Layout title={post.title}>
      <Fade in={true} timeout={800}>
        <Box sx={{ py: 4, maxWidth: 800, mx: 'auto' }}>
          <Paper
            elevation={2}
            sx={{
              borderRadius: 2,
              overflow: 'hidden',
              mb: 3
            }}
          >
            {/* Post Header */}
            <Box sx={{ p: 3, pb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                  {post.title}
                </Typography>
                
                {isAuthor && (
                  <Box>
                    <IconButton 
                      color="primary" 
                      onClick={() => navigate(`/posts/${post.id}/edit`)}
                      aria-label="edit post"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      color="error" 
                      onClick={() => setOpenDeleteDialog(true)}
                      aria-label="delete post"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                )}
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Avatar 
                  alt={post.author.username}
                  src={post.author.profile?.profile_picture || ''}
                  sx={{ mr: 1 }}
                >
                  {post.author.username.charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" component="span">
                    {post.author.first_name} {post.author.last_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" component="div">
                    {formatDate(post.created_at)}
                  </Typography>
                </Box>
              </Box>
            </Box>
            
            {/* Post Image */}
            {post.image && (
              <Box sx={{ px: 3, pb: 2 }}>
                <Card sx={{ borderRadius: 1, overflow: 'hidden', boxShadow: 'none' }}>
                  <CardMedia
                    component="img"
                    image={post.image}
                    alt={post.title}
                    sx={{ 
                      maxHeight: 500,
                      width: '100%',
                      objectFit: 'contain'
                    }}
                  />
                </Card>
              </Box>
            )}
            
            {/* Post Content */}
            <CardContent sx={{ px: 3, pt: 0 }}>
              <Typography variant="body1" paragraph sx={{ whiteSpace: 'pre-line' }}>
                {post.content}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <IconButton 
                    aria-label={post.is_liked ? 'unlike' : 'like'} 
                    onClick={handleLikeToggle}
                    color={post.is_liked ? 'secondary' : 'default'}
                    disabled={!currentUser}
                  >
                    {post.is_liked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                  </IconButton>
                  <Typography variant="body2" color="text.secondary">
                    {post.likes_count}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
                  <IconButton 
                    aria-label="comments"
                    color="default"
                    sx={{ ml: 1 }}
                  >
                    <CommentIcon />
                  </IconButton>
                  <Typography variant="body2" color="text.secondary">
                    {post.comments.length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Paper>
          
          {/* Comments Section */}
          <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Box sx={{ p: 3, bgcolor: 'background.default' }}>
              <Typography variant="h6" gutterBottom>
                Comments
              </Typography>
              
              {/* Add Comment Form */}
              {currentUser && (
                <Box component="form" onSubmit={handleAddComment} sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                    <Avatar
                      alt={currentUser.username}
                      src={currentUser.profile?.profile_picture || ''}
                      sx={{ mr: 2, mt: 1 }}
                    >
                      {currentUser.username.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <TextField
                        placeholder="Add a comment..."
                        multiline
                        fullWidth
                        rows={2}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        disabled={submittingComment}
                        error={!!commentError}
                        helperText={commentError}
                        sx={{ mb: 1 }}
                      />
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                          type="submit"
                          variant="contained"
                          disabled={!newComment.trim() || submittingComment}
                          endIcon={submittingComment ? <CircularProgress size={16} /> : <SendIcon />}
                          size="small"
                        >
                          {submittingComment ? 'Posting...' : 'Post Comment'}
                        </Button>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              )}
              
              {/* Comments List */}
              <Box sx={{ mt: 3 }}>
                {post.comments.length === 0 ? (
                  <Typography color="text.secondary" align="center" sx={{ py: 3 }}>
                    No comments yet. Be the first to comment!
                  </Typography>
                ) : (
                  post.comments.map((comment) => (
                    <Collapse key={comment.id} in={true} timeout={500}>
                      <Box sx={{ mb: 3, display: 'flex' }}>
                        <Avatar
                          alt={comment.author.username}
                          src={comment.author.profile?.profile_picture || ''}
                          sx={{ mr: 2 }}
                        >
                          {comment.author.username.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box sx={{ flexGrow: 1 }}>
                          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="subtitle2">
                                {comment.author.first_name} {comment.author.last_name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {formatDate(comment.created_at)}
                              </Typography>
                            </Box>
                            <Typography variant="body2">
                              {comment.content}
                            </Typography>
                          </Paper>
                        </Box>
                      </Box>
                    </Collapse>
                  ))
                )}
              </Box>
            </Box>
          </Paper>
        </Box>
      </Fade>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => !deleting && setOpenDeleteDialog(false)}
      >
        <DialogTitle>Delete Post?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this post? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setOpenDeleteDialog(false)} 
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeletePost} 
            color="error" 
            autoFocus
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={16} /> : <DeleteIcon />}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
};

export default PostDetail; 