from rest_framework import serializers
from .models import User, Category, Post

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    password2 = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password2', 'first_name', 'last_name']
        required_fields = ['username', 'email', 'password', 'password2']
        
    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        return user

class PostSerializer(serializers.ModelSerializer):
    author = serializers.StringRelatedField(read_only=True)
    category = serializers.StringRelatedField(read_only=True)
    category_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = Post
        fields = ['id', 'title', 'content', 'category', 'category_id', 'author', 'created_at', 'status']
        read_only_fields = ['created_at', 'author']
    
    def create(self, validated_data):
        # Get the category from the category_id
        category_id = validated_data.pop('category_id')
        try:
            category = Category.objects.get(id=category_id)
        except Category.DoesNotExist:
            raise serializers.ValidationError({"category_id": "Category not found."})
        
        # Create the post with the category and user
        post = Post.objects.create(
            category=category,
            **validated_data
        )
        return post

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['name']