import { useState } from 'react';
import { 
  Card, 
  CardHeader, 
  CardMedia, 
  CardContent, 
  CardActions, 
  Avatar, 
  IconButton, 
  Typography, 
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from '@mui/material';
import { red } from '@mui/material/colors';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import CommentIcon from '@mui/icons-material/Comment';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';
import { Post } from '../types';
import { postService } from '../services/api';
import axios from 'axios';

interface PostCardProps {
  post: Post;
  onDelete?: (postId: number) => void;
}

const PostCard = ({ post, onDelete }: PostCardProps) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [liked, setLiked] = useState(post.is_liked);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  
  const isAuthor = currentUser && post.author.id === currentUser.id;
  
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleEdit = () => {
    handleMenuClose();
    navigate(`/posts/${post.id}/edit`);
  };
  
  const handleDeleteClick = () => {
    handleMenuClose();
    setOpenDeleteDialog(true);
  };
  
  const handleDeleteCancel = () => {
    setOpenDeleteDialog(false);
  };
  
  const handleDeleteConfirm = async () => {
    try {
      await postService.deletePost(post.id);
      setOpenDeleteDialog(false);
      if (onDelete) {
        onDelete(post.id);
      }
    } catch {
      // Handle error silently
    }
  };
  
  const handlePostClick = () => {
    navigate(`/posts/${post.id}`);
  };
  
  const handleLikeToggle = async () => {
    try {
      if (!currentUser) {
        alert('Please log in to like posts');
        return;
      }
      
      if (liked) {
        await postService.unlikePost(post.id);
        setLiked(false);
        setLikesCount(likesCount - 1);
      } else {
        await postService.likePost(post.id);
        setLiked(true);
        setLikesCount(likesCount + 1);
      }
    } catch (error) {
      // Check for specific error types
      if (axios.isAxiosError(error) && error.response) {
        if (error.response.status === 401) {
          alert('Please log in to like posts');
        } else if (error.response.status === 403) {
          alert('You do not have permission to perform this action. Please log in again.');
          // The user will need to log in again
          localStorage.removeItem('token');
          navigate('/login');
        } else {
          alert('Failed to update like status. Please try again.');
        }
      } else {
        alert('Failed to connect to the server. Please check your connection.');
      }
    }
  };
  
  return (
    <>
      <Card sx={{ 
        maxWidth: '100%', 
        mb: 3,
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 10px 20px rgba(0,0,0,0.3)'
        }
      }}>
        <CardHeader
          avatar={
            <Avatar 
              sx={{ bgcolor: red[500] }} 
              aria-label="user avatar"
              src={post.author.profile?.profile_picture || undefined}
            >
              {post.author.username.charAt(0).toUpperCase()}
            </Avatar>
          }
          action={
            isAuthor && (
              <IconButton aria-label="settings" onClick={handleMenuOpen}>
                <MoreVertIcon />
              </IconButton>
            )
          }
          title={post.title}
          subheader={`${post.author.first_name} ${post.author.last_name} • ${new Date(post.created_at).toLocaleDateString()}`}
        />
        
        {post.image && (
          <CardMedia
            component="img"
            height="194"
            image={post.image}
            alt={post.title}
            sx={{ 
              cursor: 'pointer',
              objectFit: 'cover'
            }}
            onClick={handlePostClick}
          />
        )}
        
        <CardContent 
          sx={{ cursor: 'pointer' }} 
          onClick={handlePostClick}
        >
          <Typography variant="body2" color="text.secondary">
            {post.content.length > 150
              ? `${post.content.substring(0, 150)}...`
              : post.content}
          </Typography>
        </CardContent>
        
        <CardActions disableSpacing>
          <IconButton 
            aria-label={liked ? 'unlike' : 'like'} 
            onClick={handleLikeToggle}
            color={liked ? 'secondary' : 'default'}
            disabled={!currentUser}
          >
            {liked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
          </IconButton>
          <Typography variant="body2" color="text.secondary">
            {likesCount}
          </Typography>
          
          <IconButton 
            aria-label="comments"
            onClick={handlePostClick}
            sx={{ ml: 1 }}
          >
            <CommentIcon />
          </IconButton>
          <Typography variant="body2" color="text.secondary">
            {post.comments.length}
          </Typography>
        </CardActions>
      </Card>
      
      <Menu
        id="post-menu"
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEdit}>Edit</MenuItem>
        <MenuItem onClick={handleDeleteClick}>Delete</MenuItem>
      </Menu>
      
      <Dialog
        open={openDeleteDialog}
        onClose={handleDeleteCancel}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this post? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PostCard; 