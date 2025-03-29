export interface User {
  id: number;
  username: string;
  email?: string;
  first_name: string;
  last_name: string;
  profile: Profile;
}

export interface Profile {
  bio: string;
  profile_picture: string | null;
  date_joined: string;
}

export interface Post {
  id: number;
  author: Author;
  title: string;
  content: string;
  image: string | null;
  created_at: string;
  updated_at: string;
  comments: Comment[];
  likes_count: number;
  is_liked: boolean;
}

export interface Author {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  profile?: Profile;
}

export interface Comment {
  id: number;
  post: number;
  author: Author;
  content: string;
  created_at: string;
}

export interface Like {
  id: number;
  post: number;
  user: Author;
  created_at: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
  };
} 