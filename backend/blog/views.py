from django.shortcuts import render
from rest_framework import generics, status, serializers
from rest_framework.permissions import SAFE_METHODS, AllowAny, IsAdminUser, OR, IsAuthenticated
from rest_framework.response import Response
from .models import Category, Post
from .serializers import CategorySerializer, CustomTokenObtainPairSerializer, PostSerializer, UserRegistrationSerializer
from .permissions import IsAuthor
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView, TokenBlacklistView
from datetime import datetime, timedelta
from django.conf import settings
from rest_framework_simplejwt.exceptions import InvalidToken

# Create your views here.
class UserRegistrationView(generics.CreateAPIView):
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

class PostList(generics.ListCreateAPIView):
    serializer_class = PostSerializer
    queryset = Post.objects.filter(status='published')
    
    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

class PostDetail(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = PostSerializer
    
    def get_queryset(self):
        if self.request.user.is_staff:
            return Post.objects.filter(pk=self.kwargs['pk'])
        return Post.objects.filter(
            status='published',
            pk=self.kwargs['pk']
        )
    
    def perform_update(self, serializer):
        # Preserve the original author when updating
        post = self.get_object()
        serializer.save(author=post.author)
        
    def get_permissions(self):
        if self.request.method in SAFE_METHODS:
            return [AllowAny()]
        if self.request.method == 'DELETE':
            return [OR(IsAdminUser(), IsAuthor())]
        return [IsAuthor()]
        
        
class CategoryList(generics.ListCreateAPIView):
    serializer_class = CategorySerializer
    queryset = Category.objects.all()

class CategoryDropdownView(generics.ListAPIView):
    serializer_class = serializers.Serializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        return Category.objects.all()
    
    def list(self, request, *args, **kwargs):
        categories = self.get_queryset()
        data = [{'id': category.id, 'name': category.name} for category in categories]
        return Response(data)
    
# custom view for jwt payload
class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        
        # Set refresh token in HTTP-only cookie
        if response.status_code == 200:
            refresh_token = response.data.pop('refresh')  # Remove refresh from response data
            response.set_cookie(
                'refresh_token',
                refresh_token,
                max_age=5 * 24 * 60 * 60,  # 5 days
                httponly=True,
                samesite='Lax',
                secure=not settings.DEBUG  # True in production
            )
            
            # Get user from serializer
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            user = serializer.user
            
            # Add is_admin to response data
            response.data['is_admin'] = user.is_staff
            print(f"User {user.username} is_staff: {user.is_staff}")
        
        return response

class CustomTokenRefreshView(TokenRefreshView):
    def post(self, request, *args, **kwargs):
        refresh_token = request.COOKIES.get('refresh_token')
        
        if not refresh_token:
            return Response(
                {"detail": "No refresh token found in cookies."},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        request.data['refresh'] = refresh_token
        
        try:
            response = super().post(request, *args, **kwargs)
            return response
        except InvalidToken:
            return Response(
                {"detail": "Invalid refresh token."},
                status=status.HTTP_401_UNAUTHORIZED
            )

class CustomTokenBlacklistView(TokenBlacklistView):
    def post(self, request, *args, **kwargs):
        refresh_token = request.COOKIES.get('refresh_token')
        print(f"Received blacklist request. Refresh token present: {bool(refresh_token)}")
        
        if not refresh_token:
            print("No refresh token found in cookies")
            return Response(
                {"detail": "No refresh token found in cookies."},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        request.data['refresh'] = refresh_token
        
        try:
            print("Attempting to blacklist token...")
            response = super().post(request, *args, **kwargs)
            print("Token blacklisted successfully")
            return response
        except InvalidToken as e:
            print(f"Invalid token error: {str(e)}")
            return Response(
                {"detail": "Invalid refresh token."},
                status=status.HTTP_401_UNAUTHORIZED
            )
        except Exception as e:
            print(f"Unexpected error during token blacklisting: {str(e)}")
            raise