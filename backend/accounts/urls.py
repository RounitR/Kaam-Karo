from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    # Authentication endpoints
    path('register/', views.register, name='register'),
    path('login/', views.login, name='login'),
    path('logout/', views.logout, name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Profile endpoints
    path('profile/', views.user_profile, name='user_profile'),
    path('profile/customer/', views.CustomerProfileView.as_view(), name='customer_profile'),
    path('profile/worker/', views.WorkerProfileView.as_view(), name='worker_profile'),
    path('profile/worker/<int:user_id>/', views.get_worker_profile_by_user_id, name='worker_profile_by_id'),
]