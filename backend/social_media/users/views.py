from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth.models import User
from .models import Profile
from .serializers import UserSerializer, ProfileSerializer, UserRegistrationSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import authenticate
from rest_framework.authtoken.models import Token

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'register', 'login', 'debug_token']:
            return [AllowAny()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        # Regular users can only view their own profile
        if self.request.user.is_staff:
            return User.objects.all()
        return User.objects.filter(id=self.request.user.id)
    
    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def register(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            token = serializer.get_token(user)
            return Response(
                {
                    'token': token,
                    'user': {
                        'id': user.id,
                        'username': user.username,
                        'first_name': user.first_name,
                        'last_name': user.last_name
                    }
                },
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """
        Return detailed information about the current user, including profile.
        """
        user = request.user
        
        # Get user's profile
        try:
            profile = Profile.objects.get(user=user)
            profile_picture_url = None
            if profile.profile_picture and hasattr(profile.profile_picture, 'url'):
                profile_picture_url = profile.profile_picture.url
                
            profile_data = {
                'bio': profile.bio or '',
                'profile_picture': profile_picture_url,
                'date_joined': profile.user.date_joined.isoformat()
            }
        except Profile.DoesNotExist:
            profile_data = {
                'bio': '',
                'profile_picture': None,
                'date_joined': user.date_joined.isoformat()
            }
        
        # Create a custom response with user and profile data
        user_data = {
            'id': user.id,
            'username': user.username,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'profile': profile_data
        }
        
        return Response(user_data)
    
    @action(detail=False, methods=['put'])
    def update_profile(self, request):
        user = request.user
        user_data = {}
        profile_data = {}
        
        # Handle basic user fields
        for field in ['first_name', 'last_name']:
            if field in request.data:
                user_data[field] = request.data[field]
        
        # Update user if we have user data
        if user_data:
            for key, value in user_data.items():
                setattr(user, key, value)
            user.save()
        
        # Handle profile picture
        profile_picture = request.FILES.get('profile_picture')
        if profile_picture is not None:
            # Get or create profile
            profile, created = Profile.objects.get_or_create(user=user)
            profile.profile_picture = profile_picture
            profile.save()
        elif 'profile_picture' in request.data and request.data['profile_picture'] == '':
            # Remove profile picture if empty string was sent
            profile, created = Profile.objects.get_or_create(user=user)
            profile.profile_picture = None
            profile.save()
        
        # Get updated user profile data for response
        try:
            profile = Profile.objects.get(user=user)
            profile_picture_url = None
            if profile.profile_picture and hasattr(profile.profile_picture, 'url'):
                profile_picture_url = profile.profile_picture.url
                
            profile_data = {
                'bio': profile.bio or '',
                'profile_picture': profile_picture_url,
                'date_joined': profile.user.date_joined.isoformat()
            }
        except Profile.DoesNotExist:
            profile_data = {
                'bio': '',
                'profile_picture': None,
                'date_joined': user.date_joined.isoformat()
            }
        
        # Create full response
        response_data = {
            'id': user.id,
            'username': user.username,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'profile': profile_data
        }
        
        return Response(response_data)
    
    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def login(self, request):
        """
        Endpoint for user login.
        Returns a token and user data upon successful authentication.
        """
        print(request.data, 'login request data')
        username = request.data.get('username')
        password = request.data.get('password')
        
        print(f"Login attempt for user: {username}")
        print(f"Request data: {request.data}")
        
        if not username or not password:
            print(f"Login failed: Missing username or password")
            return Response(
                {'detail': 'Username and password are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if this is the superuser we just created
        superuser = User.objects.filter(username=username, is_superuser=True).first()
        if superuser:
            print(f"Found superuser {username}, attempting password verification")
            # Check password directly
            if superuser.check_password(password):
                print(f"Superuser password verified, manual login")
                token, _ = Token.objects.get_or_create(user=superuser)
                
                # Get profile for superuser
                try:
                    profile = Profile.objects.get(user=superuser)
                except Profile.DoesNotExist:
                    # Create profile for superuser if it doesn't exist
                    profile = Profile.objects.create(user=superuser)
                
                profile_data = {
                    'bio': getattr(profile, 'bio', '') or '',
                    'profile_picture': None,
                    'date_joined': superuser.date_joined.isoformat()
                }
                
                return Response({
                    'token': token.key,
                    'user': {
                        'id': superuser.id,
                        'username': superuser.username,
                        'first_name': superuser.first_name or '',
                        'last_name': superuser.last_name or '',
                        'profile': profile_data
                    }
                })
        
        # Normal authentication flow
        print(f"Attempting authentication for user: {username}")
        user = authenticate(username=username, password=password)
        
        if not user:
            print(f"Login failed: Invalid credentials for user {username}")
            return Response(
                {'detail': 'Invalid credentials'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        print(f"Login successful for user: {username}")
        token, _ = Token.objects.get_or_create(user=user)
        
        # Get user's profile
        try:
            profile = Profile.objects.get(user=user)
            profile_picture_url = None
            if profile.profile_picture and hasattr(profile.profile_picture, 'url'):
                profile_picture_url = profile.profile_picture.url
                
            profile_data = {
                'bio': profile.bio or '',
                'profile_picture': profile_picture_url,
                'date_joined': profile.user.date_joined.isoformat()
            }
        except Profile.DoesNotExist:
            profile_data = {
                'bio': '',
                'profile_picture': None,
                'date_joined': user.date_joined.isoformat()
            }
        
        return Response({
            'token': token.key,
            'user': {
                'id': user.id,
                'username': user.username,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'profile': profile_data
            }
        })
    
    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def debug_token(self, request):
        """
        Emergency endpoint to generate a debug token for the superuser.
        This is for debugging purposes only and should be removed in production.
        """
        # Find a superuser
        superuser = User.objects.filter(is_superuser=True).first()
        
        if not superuser:
            return Response({"detail": "No superuser found"}, status=status.HTTP_404_NOT_FOUND)
        
        # Create or get a token for this user
        token, _ = Token.objects.get_or_create(user=superuser)
        
        # Get or create a profile
        try:
            profile = Profile.objects.get(user=superuser)
        except Profile.DoesNotExist:
            profile = Profile.objects.create(user=superuser)
        
        profile_data = {
            'bio': getattr(profile, 'bio', '') or '',
            'profile_picture': None,
            'date_joined': superuser.date_joined.isoformat()
        }
        
        # Return the token and user data
        return Response({
            'token': token.key,
            'user': {
                'id': superuser.id,
                'username': superuser.username,
                'first_name': superuser.first_name or '',
                'last_name': superuser.last_name or '',
                'profile': profile_data
            }
        }) 