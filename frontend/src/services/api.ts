import axios from 'axios';
import { User, Comment } from '../types';

// Point directly to the backend server
const API_URL = 'http://localhost:8000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add interceptor to add auth token to requests
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    
    if (token) {
      // Add token to authorization header - MUST use the exact format "Token xxxxxx"
      config.headers.Authorization = `Token ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't auto-clear token for debugging
      // localStorage.removeItem('token');
    }
    return Promise.reject(error);
  }
);

// Authentication services
export const authService = {
  login: async (username: string, password: string) => {
    // Clear any existing token before login attempt
    localStorage.removeItem('token');
    
    // Send login request directly to Django login endpoint
    const response = await api.post('/users/login/', {
      username,
      password
    });
    
    if (response.data && response.data.token) {
      // Save token to localStorage
      localStorage.setItem('token', response.data.token);
      return response.data;
    } else {
      throw new Error('No token in response');
    }
  },
  
  register: async (userData: Partial<User>) => {
    const response = await api.post('/users/register/', userData);
    
    if (response.data && response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    
    return response.data;
  },
  
  getCurrentUser: async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No authentication token available');
    }
    
    // Use token in this specific request to ensure it's sent
    const response = await api.get('/users/me/', {
      headers: {
        'Authorization': `Token ${token}`
      }
    });
    
    return response.data;
  },
  
  updateProfile: async (userData: FormData) => {
    const response = await api.put('/users/update_profile/', userData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    // After profile update, force refresh all cached posts
    // This helps ensure that the updated profile picture appears in posts
    try {
      await postService.getAllPosts();
      await postService.getUserPosts();
      await postService.getFeed();
    } catch {
      // Don't fail if refresh fails - the main profile update was successful
    }
    
    return response.data;
  },
};

// Post services
export const postService = {
  getAllPosts: async () => {
    const response = await api.get('/posts/');
    return response.data;
  },
  getPost: async (id: number) => {
    const response = await api.get(`/posts/${id}/`);
    return response.data;
  },
  createPost: async (postData: FormData) => {
    const response = await api.post('/posts/', postData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  updatePost: async (id: number, postData: FormData) => {
    const response = await api.put(`/posts/${id}/`, postData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  deletePost: async (id: number) => {
    await api.delete(`/posts/${id}/`);
  },
  likePost: async (id: number) => {
    const response = await api.post(`/posts/${id}/like/`);
    return response.data;
  },
  unlikePost: async (id: number) => {
    const response = await api.post(`/posts/${id}/unlike/`);
    return response.data;
  },
  getUserPosts: async () => {
    const response = await api.get('/posts/my_posts/');
    return response.data;
  },
  getFeed: async () => {
    const response = await api.get('/posts/feed/');
    return response.data;
  },
};

// Comment services
export const commentService = {
  getComments: async (postId: number) => {
    const response = await api.get('/posts/comments/', {
      params: { post_id: postId },
    });
    return response.data;
  },
  createComment: async (comment: Partial<Comment>) => {
    const postId = comment.post;
    const formData = new FormData();
    formData.append('content', comment.content || '');
    
    const response = await api.post(`/posts/${postId}/comment/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  updateComment: async (id: number, content: string) => {
    const response = await api.put(`/posts/comments/${id}/`, { content });
    return response.data;
  },
  deleteComment: async (id: number) => {
    await api.delete(`/posts/comments/${id}/`);
  },
};

export default api; 