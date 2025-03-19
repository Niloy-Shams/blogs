from django.shortcuts import render
from rest_framework import generics, status
from rest_framework.permissions import SAFE_METHODS, AllowAny, IsAdminUser, OR
from rest_framework.response import Response
from .models import Category, Post
from .serializers import CategorySerializer, PostSerializer, UserRegistrationSerializer
from .permissions import IsAuthor

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

class PostDetail(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = PostSerializer
    
    def get_queryset(self):
        return Post.objects.filter(
            status='published',
            pk=self.kwargs['pk']
        )
        
    def get_permissions(self):
        if self.request.method in SAFE_METHODS:
            return [AllowAny()]
        if self.request.method == 'DELETE':
            return [OR(IsAdminUser(), IsAuthor())]
        return [IsAuthor()]
        
        
class CategoryList(generics.ListCreateAPIView):
    serializer_class = CategorySerializer
    queryset = Category.objects.all()