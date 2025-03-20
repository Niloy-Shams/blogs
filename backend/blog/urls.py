from django.urls import path
from .views import CategoryList, PostList, PostDetail, UserRegistrationView, CategoryDropdownView

urlpatterns = [
    path('', PostList.as_view(), name='post-list'),
    path('<int:pk>/', PostDetail.as_view(), name='post-detail'),
    path('category/', CategoryList.as_view(), name='category-list'),
    path('register/', UserRegistrationView.as_view(), name='user-registration'),
    path('categories/', CategoryDropdownView.as_view(), name='category-dropdown')
]
