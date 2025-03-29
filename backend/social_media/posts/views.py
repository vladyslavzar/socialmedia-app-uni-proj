from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from django.shortcuts import get_object_or_404
from .models import Post, Comment, Like
from .serializers import PostSerializer, CommentSerializer, LikeSerializer
from rest_framework.parsers import MultiPartParser, FormParser

class IsAuthorOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow authors of an object to edit or delete it.
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request
        if request.method in permissions.SAFE_METHODS:
            return True
        # Write permissions are only allowed to the author
        return obj.author == request.user

class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsAuthorOrReadOnly]
    parser_classes = [MultiPartParser, FormParser]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'content']
    ordering_fields = ['created_at', 'updated_at']
    
    def get_queryset(self):
        # Return all posts - we'll handle permissions in has_object_permission
        return Post.objects.all()
    
    @action(detail=False, methods=['get'])
    def my_posts(self, request):
        if not request.user.is_authenticated:
            return Response({'detail': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        posts = Post.objects.filter(author=request.user)
        serializer = self.get_serializer(posts, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def feed(self, request):
        if not request.user.is_authenticated:
            return Response({'detail': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        # In a more complex system, this would show posts from followed users
        # For now, show all posts (except your own)
        posts = Post.objects.exclude(author=request.user)
        serializer = self.get_serializer(posts, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def like(self, request, pk=None):
        post = self.get_object()
        user = request.user
        
        # Debug authentication
        if not request.user.is_authenticated:
            return Response({'detail': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        
        # Check if user already liked the post
        if Like.objects.filter(post=post, user=user).exists():
            return Response({'detail': 'You already liked this post'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Create a new like
        like = Like.objects.create(post=post, user=user)
        serializer = LikeSerializer(like)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def unlike(self, request, pk=None):
        post = self.get_object()
        user = request.user
        
        # Debug authentication
        if not request.user.is_authenticated:
            return Response({'detail': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        
        like = get_object_or_404(Like, post=post, user=user)
        like.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
        
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated], parser_classes=[MultiPartParser, FormParser])
    def comment(self, request, pk=None):
        post = self.get_object()
        user = request.user
        
        # Debug authentication
        if not request.user.is_authenticated:
            return Response({'detail': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        
        # Handle both JSON and FormData
        if request.content_type == 'application/json':
            content = request.data.get('content', '').strip()
        else:
            # Handle form data
            content = request.data.get('content', '').strip()
        
        if not content:
            return Response({'detail': 'Comment content is required'}, status=status.HTTP_400_BAD_REQUEST)
            
        comment = Comment.objects.create(
            post=post,
            author=user,
            content=content
        )
        
        serializer = CommentSerializer(comment, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticated, IsAuthorOrReadOnly]
    
    def get_queryset(self):
        # Filter comments by post if post_id is provided in query params
        post_id = self.request.query_params.get('post_id', None)
        if post_id:
            return Comment.objects.filter(post_id=post_id)
        return Comment.objects.all()
        
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(author=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED) 