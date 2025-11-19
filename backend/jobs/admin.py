from django.contrib import admin
from .models import Job, JobResponse, Assignment, Transaction, Payment, Earning, Rating, RatingHelpful


@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    """Admin configuration for Job model"""
    
    list_display = ('title', 'customer', 'category', 'status', 'urgency', 'budget_display', 'created_at')
    list_filter = ('status', 'category', 'urgency', 'created_at')
    search_fields = ('title', 'description', 'customer__email', 'location')
    readonly_fields = ('created_at', 'updated_at')
    ordering = ('-created_at',)
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('customer', 'title', 'category', 'description')
        }),
        ('Location & Budget', {
            'fields': ('location', 'latitude', 'longitude', 'budget_min', 'budget_max', 'fixed_amount')
        }),
        ('Job Details', {
            'fields': ('urgency', 'status', 'estimated_duration', 'requirements')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def budget_display(self, obj):
        return obj.budget_display
    budget_display.short_description = 'Budget'


@admin.register(JobResponse)
class JobResponseAdmin(admin.ModelAdmin):
    """Admin configuration for JobResponse model"""
    
    list_display = ('job', 'worker', 'response_type', 'status', 'amount_display', 'created_at')
    list_filter = ('response_type', 'status', 'created_at')
    search_fields = ('job__title', 'worker__email', 'message')
    readonly_fields = ('created_at', 'updated_at')
    ordering = ('-created_at',)
    
    fieldsets = (
        ('Response Information', {
            'fields': ('job', 'worker', 'response_type', 'status')
        }),
        ('Details', {
            'fields': ('quote_amount', 'estimated_completion_time', 'message')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def amount_display(self, obj):
        return obj.amount_display
    amount_display.short_description = 'Amount'


@admin.register(Assignment)
class AssignmentAdmin(admin.ModelAdmin):
    """Admin configuration for Assignment model"""
    
    list_display = ('job', 'worker', 'status', 'agreed_amount', 'assigned_at', 'duration_hours')
    list_filter = ('status', 'assigned_at')
    search_fields = ('job__title', 'worker__email', 'notes')
    readonly_fields = ('assigned_at', 'duration_hours')
    ordering = ('-assigned_at',)
    
    fieldsets = (
        ('Assignment Information', {
            'fields': ('job', 'worker', 'job_response', 'agreed_amount', 'status')
        }),
        ('Timeline', {
            'fields': ('assigned_at', 'started_at', 'completed_at', 'cancelled_at')
        }),
        ('Additional Details', {
            'fields': ('cancellation_reason', 'notes'),
            'classes': ('collapse',)
        }),
    )
    
    def duration_hours(self, obj):
        duration = obj.duration_hours
        return f"{duration} hours" if duration else "Not completed"
    duration_hours.short_description = 'Duration'


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    """Admin configuration for Transaction model"""
    
    list_display = ('transaction_id', 'worker', 'customer', 'transaction_type', 'amount', 'net_amount', 'status', 'created_at')
    list_filter = ('transaction_type', 'status', 'created_at')
    search_fields = ('transaction_id', 'worker__email', 'customer__email', 'description')
    readonly_fields = ('net_amount', 'created_at', 'updated_at')
    ordering = ('-created_at',)
    
    fieldsets = (
        ('Transaction Information', {
            'fields': ('transaction_id', 'assignment', 'worker', 'customer', 'transaction_type', 'status')
        }),
        ('Financial Details', {
            'fields': ('amount', 'platform_fee', 'net_amount', 'payment_method')
        }),
        ('Additional Details', {
            'fields': ('description', 'processed_at'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    """Admin configuration for Payment model"""
    
    list_display = ('transaction', 'payment_method', 'status', 'gateway_transaction_id', 'initiated_at')
    list_filter = ('payment_method', 'status', 'payment_gateway', 'initiated_at')
    search_fields = ('transaction__transaction_id', 'gateway_transaction_id', 'bank_reference', 'upi_id')
    readonly_fields = ('initiated_at', 'completed_at', 'failed_at')
    ordering = ('-initiated_at',)
    
    fieldsets = (
        ('Payment Information', {
            'fields': ('transaction', 'payment_method', 'payment_gateway', 'status')
        }),
        ('Gateway Details', {
            'fields': ('gateway_transaction_id', 'gateway_response', 'bank_reference')
        }),
        ('Bank/UPI Details', {
            'fields': ('upi_id', 'account_number', 'ifsc_code'),
            'classes': ('collapse',)
        }),
        ('Timeline', {
            'fields': ('initiated_at', 'completed_at', 'failed_at', 'failure_reason'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Earning)
class EarningAdmin(admin.ModelAdmin):
    """Admin configuration for Earning model"""
    
    list_display = ('worker', 'gross_amount', 'platform_fee', 'final_amount', 'job_category', 'customer_rating', 'earned_at')
    list_filter = ('job_category', 'earned_at')
    search_fields = ('worker__email', 'transaction__transaction_id')
    readonly_fields = ('final_amount', 'earned_at')
    ordering = ('-earned_at',)
    
    fieldsets = (
        ('Earning Information', {
            'fields': ('worker', 'transaction', 'job_category', 'job_duration_hours')
        }),
        ('Financial Breakdown', {
            'fields': ('gross_amount', 'platform_fee', 'net_amount', 'tax_deducted', 'bonus_amount', 'final_amount')
        }),
        ('Job Details', {
            'fields': ('customer_rating', 'earned_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Rating)
class RatingAdmin(admin.ModelAdmin):
    """Admin configuration for Rating model"""
    
    list_display = ('assignment', 'rater', 'ratee', 'rating_type', 'rating', 'quality_rating', 'is_verified', 'created_at')
    list_filter = ('rating_type', 'rating', 'is_verified', 'is_anonymous', 'created_at')
    search_fields = ('rater__email', 'ratee__email', 'review', 'assignment__job__title')
    readonly_fields = ('created_at', 'updated_at', 'helpful_count')
    ordering = ('-created_at',)
    
    fieldsets = (
        ('Rating Information', {
            'fields': ('assignment', 'rater', 'ratee', 'rating_type', 'rating')
        }),
        ('Detailed Ratings', {
            'fields': ('quality_rating', 'communication_rating', 'punctuality_rating', 'professionalism_rating'),
            'classes': ('collapse',)
        }),
        ('Review & Settings', {
            'fields': ('review', 'is_anonymous', 'is_verified', 'helpful_count')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('assignment', 'rater', 'ratee')


@admin.register(RatingHelpful)
class RatingHelpfulAdmin(admin.ModelAdmin):
    """Admin configuration for RatingHelpful model"""
    
    list_display = ('rating', 'user', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('rating__review', 'user__email')
    readonly_fields = ('created_at',)
    ordering = ('-created_at',)
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('rating', 'user')
