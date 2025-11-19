from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .models import User, CustomerProfile, WorkerProfile
from .serializers import (
    UserRegistrationSerializer, 
    UserLoginSerializer, 
    UserSerializer,
    CustomerProfileSerializer,
    WorkerProfileSerializer
)


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """Register a new user"""
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'message': 'User registered successfully',
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """Login user and return JWT tokens"""
    serializer = UserLoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)
        return Response({
            'message': 'Login successful',
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_profile(request):
    """Get current user profile"""
    user = request.user
    user_data = UserSerializer(user).data
    
    profile_data = None
    if user.user_type == 'customer' and hasattr(user, 'customer_profile'):
        profile_data = CustomerProfileSerializer(user.customer_profile).data
    elif user.user_type == 'worker' and hasattr(user, 'worker_profile'):
        profile_data = WorkerProfileSerializer(user.worker_profile).data
    
    return Response({
        'user': user_data,
        'profile': profile_data
    }, status=status.HTTP_200_OK)


class CustomerProfileView(generics.RetrieveUpdateAPIView):
    """View for customer profile management"""
    serializer_class = CustomerProfileSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        customer_profile, created = CustomerProfile.objects.get_or_create(user=self.request.user)
        return customer_profile
    
    def get(self, request, *args, **kwargs):
        if request.user.user_type != 'customer':
            return Response({'error': 'Only customers can access this endpoint'}, 
                          status=status.HTTP_403_FORBIDDEN)
        return super().get(request, *args, **kwargs)
    
    def put(self, request, *args, **kwargs):
        if request.user.user_type != 'customer':
            return Response({'error': 'Only customers can access this endpoint'}, 
                          status=status.HTTP_403_FORBIDDEN)
        return super().put(request, *args, **kwargs)
    
    def patch(self, request, *args, **kwargs):
        if request.user.user_type != 'customer':
            return Response({'error': 'Only customers can access this endpoint'}, 
                          status=status.HTTP_403_FORBIDDEN)
        return super().patch(request, *args, **kwargs)


class WorkerProfileView(generics.RetrieveUpdateAPIView):
    """View for worker profile management"""
    serializer_class = WorkerProfileSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        worker_profile, created = WorkerProfile.objects.get_or_create(user=self.request.user)
        return worker_profile
    
    def get(self, request, *args, **kwargs):
        if request.user.user_type != 'worker':
            return Response({'error': 'Only workers can access this endpoint'}, 
                          status=status.HTTP_403_FORBIDDEN)
        return super().get(request, *args, **kwargs)
    
    def put(self, request, *args, **kwargs):
        if request.user.user_type != 'worker':
            return Response({'error': 'Only workers can access this endpoint'}, 
                          status=status.HTTP_403_FORBIDDEN)
        return super().put(request, *args, **kwargs)
    
    def patch(self, request, *args, **kwargs):
        if request.user.user_type != 'worker':
            return Response({'error': 'Only workers can access this endpoint'}, 
                          status=status.HTTP_403_FORBIDDEN)
        return super().patch(request, *args, **kwargs)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_worker_profile_by_user_id(request, user_id):
    """Get worker profile by user ID"""
    try:
        user = User.objects.get(id=user_id, user_type='worker')
        if hasattr(user, 'worker_profile'):
            profile_data = WorkerProfileSerializer(user.worker_profile).data
            user_data = UserSerializer(user).data
            return Response({
                'user': user_data,
                'profile': profile_data
            }, status=status.HTTP_200_OK)
        else:
            return Response({'error': 'Worker profile not found'}, status=status.HTTP_404_NOT_FOUND)
    except User.DoesNotExist:
        return Response({'error': 'Worker not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    """Logout user by blacklisting refresh token"""
    try:
        refresh_token = request.data.get('refresh_token')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
        return Response({'message': 'Logout successful'}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': 'Invalid token'}, status=status.HTTP_400_BAD_REQUEST)
