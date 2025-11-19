from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from .models import User, CustomerProfile, WorkerProfile


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration"""
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ('email', 'username', 'first_name', 'last_name', 'phone_number', 
                 'user_type', 'password', 'password_confirm')
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match")
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        
        # Create profile based on user type
        if user.user_type == 'customer':
            CustomerProfile.objects.create(user=user)
        elif user.user_type == 'worker':
            WorkerProfile.objects.create(user=user)
        
        return user


class UserLoginSerializer(serializers.Serializer):
    """Serializer for user login"""
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    
    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')
        
        if email and password:
            user = authenticate(username=email, password=password)
            if not user:
                raise serializers.ValidationError('Invalid credentials')
            if not user.is_active:
                raise serializers.ValidationError('User account is disabled')
            attrs['user'] = user
            return attrs
        else:
            raise serializers.ValidationError('Must include email and password')


class UserSerializer(serializers.ModelSerializer):
    """Serializer for user details"""
    class Meta:
        model = User
        fields = ('id', 'email', 'username', 'first_name', 'last_name', 
                 'phone_number', 'user_type', 'is_verified', 'date_joined')
        read_only_fields = ('id', 'date_joined', 'is_verified')


class CustomerProfileSerializer(serializers.ModelSerializer):
    """Serializer for customer profile"""
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = CustomerProfile
        fields = '__all__'
        read_only_fields = ('user', 'total_jobs_posted', 'average_rating', 'created_at', 'updated_at')


class WorkerProfileSerializer(serializers.ModelSerializer):
    """Serializer for worker profile"""
    user = UserSerializer(read_only=True)
    skills_display = serializers.ReadOnlyField(source='get_skills_display')
    
    class Meta:
        model = WorkerProfile
        fields = '__all__'
        read_only_fields = ('user', 'total_jobs_completed', 'average_rating', 
                           'total_earnings', 'created_at', 'updated_at')
    
    def validate_skills(self, value):
        """Validate that skills are from the allowed choices"""
        valid_skills = [choice[0] for choice in WorkerProfile.SKILL_CHOICES]
        for skill in value:
            if skill not in valid_skills:
                raise serializers.ValidationError(f"'{skill}' is not a valid skill choice")
        return value