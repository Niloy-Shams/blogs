from django.shortcuts import render
from rest_framework import generics
from .models import Category, Post
from .serializers import CategorySerializer, PostSerializer

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
        
class CategoryList(generics.ListCreateAPIView):
    serializer_class = CategorySerializer
    queryset = Category.objects.all()