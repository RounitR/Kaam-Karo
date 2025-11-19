from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import RegexValidator


class User(AbstractUser):
    """Custom User model with additional fields for KaamKaro platform"""
    
    USER_TYPE_CHOICES = [
        ('customer', 'Customer'),
        ('worker', 'Worker'),
    ]
    
    email = models.EmailField(unique=True)
    phone_number = models.CharField(
        max_length=15,
        validators=[RegexValidator(regex=r'^\+?1?\d{9,15}$', message="Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed.")],
        blank=True,
        null=True
    )
    user_type = models.CharField(max_length=10, choices=USER_TYPE_CHOICES, blank=True, null=True)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    
    def __str__(self):
        return f"{self.email} ({self.get_user_type_display()})"


class CustomerProfile(models.Model):
    """Profile model for customers who post jobs"""
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='customer_profile')
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    pincode = models.CharField(max_length=10, blank=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    profile_picture = models.URLField(blank=True)
    bio = models.TextField(max_length=500, blank=True)
    total_jobs_posted = models.PositiveIntegerField(default=0)
    average_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Customer: {self.user.email}"


class WorkerProfile(models.Model):
    """Profile model for workers who accept jobs"""
    
    SKILL_CHOICES = [
        ('cleaning', 'House Cleaning'),
        ('plumbing', 'Plumbing'),
        ('electrical', 'Electrical Work'),
        ('carpentry', 'Carpentry'),
        ('painting', 'Painting'),
        ('gardening', 'Gardening'),
        ('cooking', 'Cooking'),
        ('babysitting', 'Babysitting'),
        ('elderly_care', 'Elderly Care'),
        ('pet_care', 'Pet Care'),
        ('laundry', 'Laundry'),
        ('tutoring', 'Tutoring'),
        ('other', 'Other'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='worker_profile')
    skills = models.JSONField(default=list, help_text="List of skills from SKILL_CHOICES")
    hourly_rate = models.DecimalField(max_digits=6, decimal_places=2, default=0.00)
    experience_years = models.PositiveIntegerField(default=0)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    pincode = models.CharField(max_length=10, blank=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    profile_picture = models.URLField(blank=True)
    bio = models.TextField(max_length=500, blank=True)
    is_available = models.BooleanField(default=True)
    total_jobs_completed = models.PositiveIntegerField(default=0)
    average_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    total_earnings = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Worker: {self.user.email}"
    
    def get_skills_display(self):
        """Return human-readable skills"""
        skill_dict = dict(self.SKILL_CHOICES)
        return [skill_dict.get(skill, skill) for skill in self.skills]
