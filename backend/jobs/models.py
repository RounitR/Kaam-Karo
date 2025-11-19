from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from decimal import Decimal
import uuid


class Job(models.Model):
    """Model for jobs posted by customers"""
    
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('accepted', 'Accepted'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    URGENCY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    
    CATEGORY_CHOICES = [
        ('cleaning', 'House Cleaning'),
        ('plumbing', 'Plumbing'),
        ('electrical', 'Electrical Work'),
        ('carpentry', 'Carpentry'),
        ('repair', 'Repair & Maintenance'),
        ('painting', 'Painting'),
        ('gardening', 'Gardening'),
        ('cooking', 'Cooking'),
        ('babysitting', 'Babysitting'),
        ('elderly_care', 'Elderly Care'),
        ('pet_care', 'Pet Care'),
        ('laundry', 'Laundry'),
        ('tutoring', 'Tutoring'),
        ('delivery', 'Delivery'),
        ('moving', 'Moving/Packing'),
        ('other', 'Other'),
    ]
    
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='posted_jobs'
    )
    title = models.CharField(max_length=200)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    description = models.TextField()
    location = models.CharField(max_length=300)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    budget_min = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    budget_max = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    fixed_amount = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    urgency = models.CharField(max_length=10, choices=URGENCY_CHOICES, default='medium')
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='open')
    estimated_duration = models.PositiveIntegerField(
        help_text="Estimated duration in hours", 
        null=True, 
        blank=True
    )
    requirements = models.TextField(blank=True, help_text="Special requirements or tools needed")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'category']),
            models.Index(fields=['latitude', 'longitude']),
            models.Index(fields=['-created_at']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.get_status_display()}"
    
    @property
    def is_budget_range(self):
        """Check if job has budget range vs fixed amount"""
        return self.budget_min is not None and self.budget_max is not None
    
    @property
    def budget_display(self):
        """Get formatted budget display"""
        if self.fixed_amount:
            return f"₹{self.fixed_amount}"
        elif self.is_budget_range:
            return f"₹{self.budget_min} - ₹{self.budget_max}"
        return "Budget not specified"


class JobResponse(models.Model):
    """Model for worker responses to jobs (bids/accepts)"""
    
    RESPONSE_TYPE_CHOICES = [
        ('accept', 'Accept'),
        ('quote', 'Quote'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('withdrawn', 'Withdrawn'),
    ]
    
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='responses')
    worker = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='job_responses'
    )
    response_type = models.CharField(max_length=10, choices=RESPONSE_TYPE_CHOICES)
    quote_amount = models.DecimalField(
        max_digits=8, 
        decimal_places=2, 
        null=True, 
        blank=True,
        help_text="Amount quoted by worker (for quote type responses)"
    )
    message = models.TextField(blank=True, help_text="Optional message from worker")
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='pending')
    estimated_completion_time = models.PositiveIntegerField(
        null=True, 
        blank=True,
        help_text="Worker's estimated completion time in hours"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        unique_together = ['job', 'worker']  # One response per worker per job
        indexes = [
            models.Index(fields=['job', 'status']),
            models.Index(fields=['-created_at']),
        ]
    
    def __str__(self):
        return f"{self.worker.email} - {self.job.title} ({self.get_response_type_display()})"
    
    @property
    def amount_display(self):
        """Get formatted amount display"""
        if self.quote_amount:
            return f"₹{self.quote_amount}"
        elif self.response_type == 'accept' and self.job.fixed_amount:
            return f"₹{self.job.fixed_amount}"
        return "Amount not specified"


class Assignment(models.Model):
    """Model for job assignments when a worker is selected"""
    
    STATUS_CHOICES = [
        ('assigned', 'Assigned'),
        ('started', 'Started'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    job = models.OneToOneField(Job, on_delete=models.CASCADE, related_name='assignment')
    worker = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='assignments'
    )
    job_response = models.OneToOneField(
        JobResponse, 
        on_delete=models.CASCADE, 
        related_name='assignment'
    )
    agreed_amount = models.DecimalField(max_digits=8, decimal_places=2)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='assigned')
    assigned_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    cancellation_reason = models.TextField(blank=True)
    notes = models.TextField(blank=True, help_text="Additional notes about the assignment")
    
    class Meta:
        ordering = ['-assigned_at']
        indexes = [
            models.Index(fields=['worker', 'status']),
            models.Index(fields=['job', 'status']),
            models.Index(fields=['-assigned_at']),
        ]
    
    def __str__(self):
        return f"{self.job.title} assigned to {self.worker.email}"
    
    @property
    def duration_hours(self):
        """Calculate duration if both started and completed"""
        if self.started_at and self.completed_at:
            delta = self.completed_at - self.started_at
            return round(delta.total_seconds() / 3600, 2)
        return None


class Transaction(models.Model):
    """Model for tracking financial transactions related to jobs"""
    
    TRANSACTION_TYPE_CHOICES = [
        ('payment', 'Payment'),
        ('refund', 'Refund'),
        ('bonus', 'Bonus'),
        ('penalty', 'Penalty'),
        ('platform_fee', 'Platform Fee'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]
    
    assignment = models.ForeignKey(
        Assignment, 
        on_delete=models.CASCADE, 
        related_name='transactions',
        null=True,
        blank=True,
        help_text="Related assignment (if applicable)"
    )
    worker = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='worker_transactions'
    )
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='customer_transactions'
    )
    transaction_type = models.CharField(max_length=15, choices=TRANSACTION_TYPE_CHOICES)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    platform_fee = models.DecimalField(
        max_digits=8, 
        decimal_places=2, 
        default=0.00,
        help_text="Platform fee deducted from worker payment"
    )
    net_amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        help_text="Amount after platform fee deduction"
    )
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='pending')
    description = models.TextField(blank=True, help_text="Transaction description")
    payment_method = models.CharField(max_length=50, blank=True, help_text="Payment method used")
    transaction_id = models.CharField(max_length=100, unique=True, help_text="Unique transaction identifier")
    processed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['worker', 'status']),
            models.Index(fields=['customer', 'status']),
            models.Index(fields=['transaction_type', 'status']),
            models.Index(fields=['-created_at']),
        ]
    
    def __str__(self):
        return f"{self.get_transaction_type_display()} - ₹{self.amount} ({self.worker.email})"
    
    def save(self, *args, **kwargs):
        """Calculate net amount before saving and ensure transaction_id"""
        # Auto-generate a unique transaction_id if missing
        if not getattr(self, 'transaction_id', None):
            # Generate a short unique identifier with a stable prefix
            candidate = f"TXN-{uuid.uuid4().hex[:12].upper()}"
            # Ensure uniqueness conservatively
            while Transaction.objects.filter(transaction_id=candidate).exists():
                candidate = f"TXN-{uuid.uuid4().hex[:12].upper()}"
            self.transaction_id = candidate

        # Calculate net amount
        if self.transaction_type == 'payment':
            self.net_amount = self.amount - self.platform_fee
        else:
            self.net_amount = self.amount
        super().save(*args, **kwargs)


class Payment(models.Model):
    """Model for tracking payment details and history"""
    
    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    ]
    
    PAYMENT_METHOD_CHOICES = [
        ('upi', 'UPI'),
        ('bank_transfer', 'Bank Transfer'),
        ('wallet', 'Digital Wallet'),
        ('cash', 'Cash'),
        ('card', 'Credit/Debit Card'),
    ]
    
    transaction = models.OneToOneField(
        Transaction, 
        on_delete=models.CASCADE, 
        related_name='payment_details'
    )
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES)
    payment_gateway = models.CharField(max_length=50, blank=True, help_text="Payment gateway used")
    gateway_transaction_id = models.CharField(max_length=100, blank=True)
    gateway_response = models.JSONField(default=dict, blank=True, help_text="Gateway response data")
    bank_reference = models.CharField(max_length=100, blank=True)
    upi_id = models.CharField(max_length=100, blank=True)
    account_number = models.CharField(max_length=20, blank=True)
    ifsc_code = models.CharField(max_length=15, blank=True)
    status = models.CharField(max_length=15, choices=PAYMENT_STATUS_CHOICES, default='pending')
    initiated_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    failed_at = models.DateTimeField(null=True, blank=True)
    failure_reason = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-initiated_at']
        indexes = [
            models.Index(fields=['payment_method', 'status']),
            models.Index(fields=['-initiated_at']),
        ]
    
    def __str__(self):
        return f"Payment {self.transaction.transaction_id} - {self.get_payment_method_display()}"


class Earning(models.Model):
    """Model for tracking worker earnings summary"""
    
    worker = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='earnings'
    )
    transaction = models.OneToOneField(
        Transaction, 
        on_delete=models.CASCADE, 
        related_name='earning_record'
    )
    gross_amount = models.DecimalField(max_digits=10, decimal_places=2)
    platform_fee = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)
    net_amount = models.DecimalField(max_digits=10, decimal_places=2)
    tax_deducted = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)
    final_amount = models.DecimalField(max_digits=10, decimal_places=2)
    earned_at = models.DateTimeField(auto_now_add=True)
    
    # Additional earning details
    job_category = models.CharField(max_length=20, blank=True)
    job_duration_hours = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    customer_rating = models.DecimalField(
        max_digits=3, 
        decimal_places=2, 
        null=True, 
        blank=True,
        validators=[MinValueValidator(1.0), MaxValueValidator(5.0)]
    )
    bonus_amount = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)
    
    class Meta:
        ordering = ['-earned_at']
        indexes = [
            models.Index(fields=['worker', '-earned_at']),
            models.Index(fields=['job_category']),
        ]
    
    def __str__(self):
        return f"{self.worker.email} - ₹{self.final_amount} ({self.earned_at.date()})"
    
    def save(self, *args, **kwargs):
        """Calculate final amount before saving"""
        # Ensure Decimal arithmetic by coercing potential float defaults
        net = Decimal(self.net_amount or 0)
        tax = Decimal(self.tax_deducted or 0)
        bonus = Decimal(self.bonus_amount or 0)
        self.final_amount = net - tax + bonus
        super().save(*args, **kwargs)


class Rating(models.Model):
    """Model for ratings and reviews between customers and workers"""
    
    RATING_TYPE_CHOICES = [
        ('customer_to_worker', 'Customer to Worker'),
        ('worker_to_customer', 'Worker to Customer'),
    ]
    
    assignment = models.ForeignKey(
        Assignment, 
        on_delete=models.CASCADE, 
        related_name='ratings'
    )
    rater = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='given_ratings',
        help_text="User who is giving the rating"
    )
    ratee = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='received_ratings',
        help_text="User who is receiving the rating"
    )
    rating_type = models.CharField(max_length=20, choices=RATING_TYPE_CHOICES)
    rating = models.DecimalField(
        max_digits=3, 
        decimal_places=2,
        validators=[MinValueValidator(1.0), MaxValueValidator(5.0)],
        help_text="Rating from 1.0 to 5.0"
    )
    review = models.TextField(blank=True, help_text="Optional written review")
    
    # Specific rating criteria
    quality_rating = models.DecimalField(
        max_digits=3, 
        decimal_places=2,
        validators=[MinValueValidator(1.0), MaxValueValidator(5.0)],
        null=True,
        blank=True,
        help_text="Quality of work/service rating"
    )
    communication_rating = models.DecimalField(
        max_digits=3, 
        decimal_places=2,
        validators=[MinValueValidator(1.0), MaxValueValidator(5.0)],
        null=True,
        blank=True,
        help_text="Communication rating"
    )
    punctuality_rating = models.DecimalField(
        max_digits=3, 
        decimal_places=2,
        validators=[MinValueValidator(1.0), MaxValueValidator(5.0)],
        null=True,
        blank=True,
        help_text="Punctuality/timeliness rating"
    )
    professionalism_rating = models.DecimalField(
        max_digits=3, 
        decimal_places=2,
        validators=[MinValueValidator(1.0), MaxValueValidator(5.0)],
        null=True,
        blank=True,
        help_text="Professionalism rating"
    )
    
    is_anonymous = models.BooleanField(default=False, help_text="Whether the review is anonymous")
    is_verified = models.BooleanField(default=True, help_text="Whether the rating is from a verified transaction")
    helpful_count = models.PositiveIntegerField(default=0, help_text="Number of users who found this review helpful")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        unique_together = ['assignment', 'rater', 'ratee']  # One rating per assignment per rater-ratee pair
        indexes = [
            models.Index(fields=['ratee', 'rating_type']),
            models.Index(fields=['rater', 'rating_type']),
            models.Index(fields=['assignment']),
            models.Index(fields=['-created_at']),
            models.Index(fields=['rating']),
        ]
    
    def __str__(self):
        return f"{self.rater.email} → {self.ratee.email}: {self.rating}★ ({self.get_rating_type_display()})"
    
    def save(self, *args, **kwargs):
        """Update user average ratings when a new rating is saved"""
        super().save(*args, **kwargs)
        self.update_user_average_ratings()
    
    def update_user_average_ratings(self):
        """Update the average rating for the ratee"""
        from django.db.models import Avg
        from accounts.models import CustomerProfile, WorkerProfile
        
        # Calculate new average rating for the ratee
        if self.rating_type == 'customer_to_worker':
            # Update worker's average rating
            worker_ratings = Rating.objects.filter(
                ratee=self.ratee, 
                rating_type='customer_to_worker'
            ).aggregate(avg_rating=Avg('rating'))
            
            avg_rating = worker_ratings['avg_rating'] or 0.00
            
            try:
                worker_profile = WorkerProfile.objects.get(user=self.ratee)
                worker_profile.average_rating = round(avg_rating, 2)
                worker_profile.save()
            except WorkerProfile.DoesNotExist:
                pass
                
        elif self.rating_type == 'worker_to_customer':
            # Update customer's average rating
            customer_ratings = Rating.objects.filter(
                ratee=self.ratee, 
                rating_type='worker_to_customer'
            ).aggregate(avg_rating=Avg('rating'))
            
            avg_rating = customer_ratings['avg_rating'] or 0.00
            
            try:
                customer_profile = CustomerProfile.objects.get(user=self.ratee)
                customer_profile.average_rating = round(avg_rating, 2)
                customer_profile.save()
            except CustomerProfile.DoesNotExist:
                pass


class RatingHelpful(models.Model):
    """Model to track which users found a rating helpful"""
    
    rating = models.ForeignKey(Rating, on_delete=models.CASCADE, related_name='helpful_votes')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['rating', 'user']  # One vote per user per rating
        indexes = [
            models.Index(fields=['rating']),
            models.Index(fields=['user']),
        ]
    
    def __str__(self):
        return f"{self.user.email} found rating helpful: {self.rating.id}"
