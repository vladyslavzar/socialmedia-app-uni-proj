from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PostViewSet, CommentViewSet

router = DefaultRouter()
router.register(r'', PostViewSet, basename='posts')

# Create a separate router for comments
comments_router = DefaultRouter()
comments_router.register(r'', CommentViewSet, basename='comments')

urlpatterns = [
    path('', include(router.urls)),
    path('comments/', include(comments_router.urls)),
] 