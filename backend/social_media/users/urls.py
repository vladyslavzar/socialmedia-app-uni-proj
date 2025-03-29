from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet

router = DefaultRouter()
router.register(r'', UserViewSet)

# Add explicit URL patterns for custom actions in the ViewSet
urlpatterns = [
    # Login action needs to be explicitly mapped
    path('login/', UserViewSet.as_view({'post': 'login'}), name='user-login'),
    path('register/', UserViewSet.as_view({'post': 'register'}), name='user-register'),
    path('me/', UserViewSet.as_view({'get': 'me'}), name='current-user'),
    path('update_profile/', UserViewSet.as_view({'put': 'update_profile'}), name='update-profile'),
    path('debug_token/', UserViewSet.as_view({'get': 'debug_token'}), name='debug-token'),
    
    # Include the router URLs after explicit URLs
    path('', include(router.urls)),
] 