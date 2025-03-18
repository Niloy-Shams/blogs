from django.shortcuts import render
from rest_framework import generics
from rest_framework.permissions import SAFE_METHODS, AllowAny, IsAdminUser, OR
from .models import Category, Post
from .serializers import CategorySerializer, PostSerializer
from .permissions import IsAuthor

# Create your views here.
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