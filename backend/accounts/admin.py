from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, CustomerProfile, WorkerProfile


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Admin configuration for custom User model"""
    list_display = ('email', 'username', 'first_name', 'last_name', 'user_type', 'is_verified', 'is_active', 'date_joined')
    list_filter = ('user_type', 'is_verified', 'is_active', 'is_staff', 'is_superuser')
    search_fields = ('email', 'username', 'first_name', 'last_name', 'phone_number')
    ordering = ('-date_joined',)
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Additional Info', {
            'fields': ('phone_number', 'user_type', 'is_verified')
        }),
    )
    
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Additional Info', {
            'fields': ('email', 'phone_number', 'user_type')
        }),
    )


@admin.register(CustomerProfile)
class CustomerProfileAdmin(admin.ModelAdmin):
    """Admin configuration for CustomerProfile"""
    list_display = ('user', 'city', 'state', 'total_jobs_posted', 'average_rating', 'created_at')
    list_filter = ('city', 'state', 'created_at')
    search_fields = ('user__email', 'user__first_name', 'user__last_name', 'city', 'state')
    readonly_fields = ('total_jobs_posted', 'average_rating', 'created_at', 'updated_at')
    
    fieldsets = (
        ('User Info', {
            'fields': ('user',)
        }),
        ('Location', {
            'fields': ('address', 'city', 'state', 'pincode', 'latitude', 'longitude')
        }),
        ('Profile', {
            'fields': ('profile_picture', 'bio')
        }),
        ('Statistics', {
            'fields': ('total_jobs_posted', 'average_rating'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(WorkerProfile)
class WorkerProfileAdmin(admin.ModelAdmin):
    """Admin configuration for WorkerProfile"""
    list_display = ('user', 'city', 'state', 'hourly_rate', 'experience_years', 'is_available', 'total_jobs_completed', 'average_rating')
    list_filter = ('is_available', 'city', 'state', 'experience_years', 'created_at')
    search_fields = ('user__email', 'user__first_name', 'user__last_name', 'city', 'state', 'skills')
    readonly_fields = ('total_jobs_completed', 'average_rating', 'total_earnings', 'created_at', 'updated_at')
    
    fieldsets = (
        ('User Info', {
            'fields': ('user',)
        }),
        ('Professional Info', {
            'fields': ('skills', 'hourly_rate', 'experience_years', 'is_available')
        }),
        ('Location', {
            'fields': ('address', 'city', 'state', 'pincode', 'latitude', 'longitude')
        }),
        ('Profile', {
            'fields': ('profile_picture', 'bio')
        }),
        ('Statistics', {
            'fields': ('total_jobs_completed', 'average_rating', 'total_earnings'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
