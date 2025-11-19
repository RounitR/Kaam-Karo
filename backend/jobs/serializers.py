from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Job, JobResponse, Assignment, Transaction, Payment, Earning, Rating, RatingHelpful

User = get_user_model()


class JobSerializer(serializers.ModelSerializer):
    """Serializer for Job model"""
    
    customer_name = serializers.CharField(source='customer.username', read_only=True)
    customer_email = serializers.CharField(source='customer.email', read_only=True)
    budget_display = serializers.CharField(read_only=True)
    is_budget_range = serializers.BooleanField(read_only=True)
    responses_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Job
        fields = [
            'id', 'customer', 'customer_name', 'customer_email', 'title', 'category', 
            'description', 'location', 'latitude', 'longitude', 'budget_min', 
            'budget_max', 'fixed_amount', 'budget_display', 'is_budget_range',
            'urgency', 'status', 'estimated_duration', 'requirements', 
            'responses_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'customer', 'created_at', 'updated_at']
    
    def get_responses_count(self, obj):
        """Get count of responses for this job"""
        return obj.responses.count()
    
    def validate(self, data):
        """Custom validation for job data"""
        budget_min = data.get('budget_min')
        budget_max = data.get('budget_max')
        fixed_amount = data.get('fixed_amount')
        
        # Ensure either fixed amount or budget range is provided
        if not fixed_amount and not (budget_min and budget_max):
            raise serializers.ValidationError(
                "Either provide a fixed amount or both minimum and maximum budget."
            )
        
        # Ensure budget range is valid
        if budget_min and budget_max and budget_min >= budget_max:
            raise serializers.ValidationError(
                "Minimum budget must be less than maximum budget."
            )
        
        return data
    
    def create(self, validated_data):
        """Create job with current user as customer"""
        validated_data['customer'] = self.context['request'].user
        return super().create(validated_data)


class JobListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for job listings"""
    
    customer_name = serializers.CharField(source='customer.username', read_only=True)
    budget_display = serializers.CharField(read_only=True)
    responses_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Job
        fields = [
            'id', 'customer_name', 'title', 'category', 'location', 
            'budget_display', 'urgency', 'status', 'responses_count', 'created_at'
        ]
    
    def get_responses_count(self, obj):
        return obj.responses.count()


class JobResponseSerializer(serializers.ModelSerializer):
    """Serializer for JobResponse model"""
    
    worker_name = serializers.CharField(source='worker.username', read_only=True)
    worker_email = serializers.CharField(source='worker.email', read_only=True)
    job_title = serializers.CharField(source='job.title', read_only=True)
    amount_display = serializers.CharField(read_only=True)
    
    class Meta:
        model = JobResponse
        fields = [
            'id', 'job', 'job_title', 'worker', 'worker_name', 'worker_email',
            'response_type', 'quote_amount', 'amount_display', 'message', 
            'status', 'estimated_completion_time', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'job', 'worker', 'created_at', 'updated_at']
    
    def validate(self, data):
        """Validate job response data"""
        response_type = data.get('response_type')
        
        # For quote responses, quote_amount is required
        if response_type == 'quote':
            quote_amount = data.get('quote_amount')
            if not quote_amount:
                raise serializers.ValidationError({
                    'quote_amount': 'Quote amount is required for quote responses.'
                })
        
        return data
    
    def create(self, validated_data):
        """Create job response with current user as worker"""
        # Worker is already set in the view's perform_create method
        return super().create(validated_data)


class AssignmentSerializer(serializers.ModelSerializer):
    """Serializer for Assignment model"""
    
    job_title = serializers.CharField(source='job.title', read_only=True)
    worker_name = serializers.CharField(source='worker.username', read_only=True)
    worker_email = serializers.CharField(source='worker.email', read_only=True)
    customer_name = serializers.CharField(source='job.customer.username', read_only=True)
    duration_hours = serializers.CharField(read_only=True)
    
    class Meta:
        model = Assignment
        fields = [
            'id', 'job', 'job_title', 'worker', 'worker_name', 'worker_email',
            'customer_name', 'job_response', 'agreed_amount', 'status',
            'assigned_at', 'started_at', 'completed_at', 'cancelled_at',
            'cancellation_reason', 'notes', 'duration_hours'
        ]
        read_only_fields = [
            'id', 'assigned_at', 'duration_hours'
        ]


class JobDetailSerializer(JobSerializer):
    """Detailed serializer for job with responses"""
    
    responses = JobResponseSerializer(many=True, read_only=True)
    assignment = AssignmentSerializer(read_only=True)
    
    class Meta(JobSerializer.Meta):
        fields = JobSerializer.Meta.fields + ['responses', 'assignment']


class WorkerJobListSerializer(serializers.ModelSerializer):
    """Serializer for jobs list from worker perspective"""
    
    customer_name = serializers.CharField(source='customer.username', read_only=True)
    budget_display = serializers.CharField(read_only=True)
    distance = serializers.SerializerMethodField()
    has_responded = serializers.SerializerMethodField()
    
    class Meta:
        model = Job
        fields = [
            'id', 'customer_name', 'title', 'category', 'description', 'location',
            'budget_display', 'urgency', 'estimated_duration', 'distance',
            'has_responded', 'created_at'
        ]
    
    def get_distance(self, obj):
        """Calculate distance from worker location (placeholder)"""
        # TODO: Implement actual distance calculation in Phase 3
        return "2.5 km"
    
    def get_has_responded(self, obj):
        """Check if current user has responded to this job"""
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            return obj.responses.filter(worker=request.user).exists()
        return False


class TransactionSerializer(serializers.ModelSerializer):
    """Serializer for Transaction model"""
    
    worker_name = serializers.CharField(source='worker.username', read_only=True)
    customer_name = serializers.CharField(source='customer.username', read_only=True)
    assignment_job_title = serializers.CharField(source='assignment.job.title', read_only=True)
    
    class Meta:
        model = Transaction
        fields = [
            'id', 'transaction_id', 'assignment', 'assignment_job_title', 'worker', 
            'worker_name', 'customer', 'customer_name', 'transaction_type', 'amount', 
            'platform_fee', 'net_amount', 'payment_method', 'status', 'description', 
            'processed_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'transaction_id', 'net_amount', 'created_at', 'updated_at']


class PaymentSerializer(serializers.ModelSerializer):
    """Serializer for Payment model"""
    
    transaction_id = serializers.CharField(source='transaction.transaction_id', read_only=True)
    
    class Meta:
        model = Payment
        fields = [
            'id', 'transaction', 'transaction_id', 'payment_method', 'payment_gateway',
            'gateway_transaction_id', 'gateway_response', 'bank_reference', 'upi_id',
            'account_number', 'ifsc_code', 'status', 'initiated_at', 'completed_at',
            'failed_at', 'failure_reason'
        ]
        read_only_fields = ['id', 'initiated_at', 'completed_at', 'failed_at']


class EarningSerializer(serializers.ModelSerializer):
    """Serializer for Earning model"""
    
    worker_name = serializers.CharField(source='worker.username', read_only=True)
    transaction_id = serializers.CharField(source='transaction.transaction_id', read_only=True)
    
    class Meta:
        model = Earning
        fields = [
            'id', 'worker', 'worker_name', 'transaction', 'transaction_id', 'gross_amount',
            'platform_fee', 'net_amount', 'tax_deducted', 'bonus_amount', 'final_amount',
            'job_category', 'job_duration_hours', 'customer_rating', 'earned_at'
        ]
        read_only_fields = ['id', 'final_amount', 'earned_at']


class EarningsSummarySerializer(serializers.Serializer):
    """Serializer for earnings summary data"""
    
    total_earnings = serializers.DecimalField(max_digits=10, decimal_places=2)
    gross_total_earnings = serializers.DecimalField(max_digits=10, decimal_places=2)
    this_month_earnings = serializers.DecimalField(max_digits=10, decimal_places=2)
    this_month_gross_earnings = serializers.DecimalField(max_digits=10, decimal_places=2)
    pending_amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    completed_jobs = serializers.IntegerField()
    average_rating = serializers.DecimalField(max_digits=3, decimal_places=2)
    recent_transactions = TransactionSerializer(many=True)
    monthly_earnings = serializers.ListField(
        child=serializers.DictField()
    )


class RatingSerializer(serializers.ModelSerializer):
    """Serializer for Rating model"""
    
    rater_name = serializers.CharField(source='rater.username', read_only=True)
    ratee_name = serializers.CharField(source='ratee.username', read_only=True)
    assignment_job_title = serializers.CharField(source='assignment.job.title', read_only=True)
    can_rate = serializers.SerializerMethodField()
    
    class Meta:
        model = Rating
        fields = [
            'id', 'assignment', 'assignment_job_title', 'rater', 'rater_name', 
            'ratee', 'ratee_name', 'rating_type', 'rating', 'review',
            'quality_rating', 'communication_rating', 'punctuality_rating', 
            'professionalism_rating', 'is_anonymous', 'is_verified', 
            'helpful_count', 'can_rate', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'rater', 'helpful_count', 'is_verified', 'created_at', 'updated_at']
    
    def get_can_rate(self, obj):
        """Check if the current user can rate this assignment"""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        
        # User can rate if they are either the customer or worker in the assignment
        assignment = obj.assignment
        return request.user in [assignment.job.customer, assignment.worker]
    
    def validate(self, data):
        """Custom validation for rating data"""
        assignment = data.get('assignment')
        # Always use the authenticated user as the rater for validation
        request = self.context.get('request')
        rater = getattr(request, 'user', None)
        ratee = data.get('ratee')
        rating_type = data.get('rating_type')
        
        if not assignment:
            raise serializers.ValidationError("Assignment is required.")
        
        # Validate that assignment is completed
        if assignment.status != 'completed':
            raise serializers.ValidationError("Can only rate completed assignments.")

        # Infer missing ratee/rating_type based on the authenticated user and assignment
        if not ratee or not rating_type:
            if rater == assignment.job.customer:
                data['rating_type'] = 'customer_to_worker'
                data['ratee'] = assignment.worker
                ratee = data['ratee']
                rating_type = data['rating_type']
            elif rater == assignment.worker:
                data['rating_type'] = 'worker_to_customer'
                data['ratee'] = assignment.job.customer
                ratee = data['ratee']
                rating_type = data['rating_type']
            else:
                raise serializers.ValidationError("You are not part of this assignment.")
        
        # Validate rating type matches the rater-ratee relationship
        if rating_type == 'customer_to_worker':
            if rater != assignment.job.customer or ratee != assignment.worker:
                raise serializers.ValidationError(
                    "Invalid rater-ratee relationship for customer to worker rating."
                )
        elif rating_type == 'worker_to_customer':
            if rater != assignment.worker or ratee != assignment.job.customer:
                raise serializers.ValidationError(
                    "Invalid rater-ratee relationship for worker to customer rating."
                )

        # If overall rating is missing, compute it from available detailed ratings
        if data.get('rating') is None:
            from decimal import Decimal
            components = [
                data.get('quality_rating'),
                data.get('communication_rating'),
                data.get('punctuality_rating'),
                data.get('professionalism_rating'),
            ]
            vals = [Decimal(v) for v in components if v is not None]
            if vals:
                avg = sum(vals) / Decimal(len(vals))
                # Clamp to 1.0-5.0 range using Decimal
                if avg < Decimal('1.0'):
                    avg = Decimal('1.0')
                elif avg > Decimal('5.0'):
                    avg = Decimal('5.0')
                # Quantize to two decimal places
                data['rating'] = avg.quantize(Decimal('0.01'))
            else:
                raise serializers.ValidationError("Overall rating is required.")
        
        # Check if rating already exists
        existing_rating = Rating.objects.filter(
            assignment=assignment, rater=rater, ratee=ratee
        ).first()
        
        if existing_rating and not self.instance:
            raise serializers.ValidationError("Rating already exists for this assignment.")
        
        return data
    
    def create(self, validated_data):
        """Create a new rating"""
        validated_data['rater'] = self.context['request'].user
        return super().create(validated_data)


class RatingListSerializer(serializers.ModelSerializer):
    """Simplified serializer for rating lists"""
    
    rater_name = serializers.CharField(source='rater.username', read_only=True)
    assignment_job_title = serializers.CharField(source='assignment.job.title', read_only=True)
    
    class Meta:
        model = Rating
        fields = [
            'id', 'assignment_job_title', 'rater_name', 'rating', 'review',
            'is_anonymous', 'helpful_count', 'created_at'
        ]


class RatingHelpfulSerializer(serializers.ModelSerializer):
    """Serializer for RatingHelpful model"""
    
    user_name = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = RatingHelpful
        fields = ['id', 'rating', 'user', 'user_name', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']
    
    def validate(self, data):
        """Validate that user hasn't already marked this rating as helpful"""
        rating = data.get('rating')
        user = self.context['request'].user
        
        if RatingHelpful.objects.filter(rating=rating, user=user).exists():
            raise serializers.ValidationError("You have already marked this rating as helpful.")
        
        return data
    
    def create(self, validated_data):
        """Create a new helpful vote"""
        validated_data['user'] = self.context['request'].user
        helpful_vote = super().create(validated_data)
        
        # Update the helpful count on the rating
        rating = helpful_vote.rating
        rating.helpful_count = rating.helpful_votes.count()
        rating.save()
        
        return helpful_vote


class UserRatingSummarySerializer(serializers.Serializer):
    """Serializer for user rating summary"""
    
    average_rating = serializers.DecimalField(max_digits=3, decimal_places=2)
    total_ratings = serializers.IntegerField()
    rating_distribution = serializers.DictField()
    recent_ratings = RatingListSerializer(many=True)