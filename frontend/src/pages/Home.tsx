import { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Paper, Button } from '@mui/material';
import Layout from '../components/Layout';
import PostCard from '../components/PostCard';
import { postService } from '../services/api';
import { Post } from '../types';
import { useAuth } from '../contexts/useAuth';
import { Link as RouterLink, useLocation } from 'react-router-dom';

const Home = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();
  const location = useLocation();

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      // Get all posts
      const response = await postService.getAllPosts();
      setPosts(response);
      setError(null);
    } catch {
      if (currentUser) {
        setError('Failed to load posts. Please try again later.');
      } else {
        setError(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = (postId: number) => {
    setPosts(posts.filter(post => post.id !== postId));
  };

  return (
    <Layout>
      <Box sx={{ 
        mb: 3, 
        mt: 2,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Typography variant="h5" component="h1">
          Recent Posts
        </Typography>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" height="60vh">
          <CircularProgress />
        </Box>
      ) : error ? (
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="60vh">
          <Typography color="error" gutterBottom>
            {error}
          </Typography>
          {!currentUser && (
            <Paper sx={{ p: 3, textAlign: 'center', maxWidth: 400, width: '100%', borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom>
                Welcome to Social Media App
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Please log in to view and interact with posts.
              </Typography>
              <Button
                component={RouterLink}
                to="/login"
                variant="contained"
                color="primary"
                sx={{ mr: 2 }}
              >
                Login
              </Button>
              <Button
                component={RouterLink}
                to="/register"
                variant="outlined"
                color="primary"
              >
                Register
              </Button>
            </Paper>
          )}
        </Box>
      ) : posts.length > 0 ? (
        <Box>
          {posts.map(post => (
            <PostCard key={post.id} post={post} onDelete={handleDeletePost} />
          ))}
        </Box>
      ) : (
        <Typography variant="h6" align="center" color="text.secondary" sx={{ mt: 4 }}>
          No posts yet. Be the first to post!
        </Typography>
      )}
    </Layout>
  );
};

export default Home; 