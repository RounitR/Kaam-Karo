from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from django.shortcuts import get_object_or_404
from django.db.models import Q, Sum, Avg, Count
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.conf import settings
from datetime import datetime, timedelta
from decimal import Decimal
from .models import Job, JobResponse, Assignment, Transaction, Payment, Earning, Rating, RatingHelpful
from .serializers import (
    JobSerializer, JobListSerializer, JobDetailSerializer,
    JobResponseSerializer, AssignmentSerializer, WorkerJobListSerializer,
    TransactionSerializer, PaymentSerializer, EarningSerializer, EarningsSummarySerializer,
    RatingSerializer, RatingListSerializer, RatingHelpfulSerializer, UserRatingSummarySerializer
)

User = get_user_model()


class JobListCreateView(generics.ListCreateAPIView):
    """
    List all jobs or create a new job.
    GET: List jobs (filtered by user type)
    POST: Create new job (customers only)
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method == 'GET':
            if self.request.user.user_type == 'worker':
                return WorkerJobListSerializer
            # Use JobDetailSerializer for customers to include responses
            return JobDetailSerializer
        return JobSerializer
    
    def get_queryset(self):
        user = self.request.user
        queryset = Job.objects.select_related('customer').prefetch_related('responses')
        
        if user.user_type == 'customer':
            # Customers see only their own jobs
            queryset = queryset.filter(customer=user)
        elif user.user_type == 'worker':
            # Workers see jobs that are open (no assignment yet)
            # This means jobs remain visible until customer accepts a worker
            queryset = queryset.filter(status='open')
            
            # Exclude jobs where this worker has already responded
            responded_job_ids = JobResponse.objects.filter(
                worker=user
            ).values_list('job_id', flat=True)
            queryset = queryset.exclude(id__in=responded_job_ids)
            
            # Optional filtering by category, location, etc.
            category = self.request.query_params.get('category')
            if category:
                queryset = queryset.filter(category=category)
            
            location = self.request.query_params.get('location')
            if location:
                queryset = queryset.filter(
                    Q(location__icontains=location)
                )
        
        return queryset.order_by('-created_at')
    
    def perform_create(self, serializer):
        # Only customers can create jobs
        if self.request.user.user_type != 'customer':
            raise PermissionDenied("Only customers can create jobs.")
        
        serializer.save(customer=self.request.user)


class JobDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update or delete a job instance.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = JobDetailSerializer
    
    def get_queryset(self):
        user = self.request.user
        queryset = Job.objects.select_related('customer').prefetch_related(
            'responses__worker', 'assignment__worker'
        )
        
        if user.user_type == 'customer':
            # Customers can only access their own jobs
            return queryset.filter(customer=user)
        elif user.user_type == 'worker':
            # Workers can view any job but with limited update permissions
            return queryset.all()
        
        return queryset.none()
    
    def perform_update(self, serializer):
        job = self.get_object()
        
        # Only the job creator can update the job
        if job.customer != self.request.user:
            raise PermissionDenied("You can only update your own jobs.")
        
        # Don't allow updating completed jobs
        if job.status == 'completed':
            raise PermissionDenied(
                "Cannot update a completed job."
            )
        
        serializer.save()
    
    def perform_destroy(self, instance):
        # Only the job creator can delete the job
        if instance.customer != self.request.user:
            raise PermissionDenied("You can only delete your own jobs.")
        
        # Don't allow deleting jobs that are in progress or completed
        if instance.status in ['in_progress', 'completed']:
            raise PermissionDenied(
                "Cannot delete jobs that are in progress or completed."
            )
        
        instance.delete()


class JobResponseListCreateView(generics.ListCreateAPIView):
    """
    List job responses or create a new response.
    GET: List responses for a specific job
    POST: Create new response (workers only)
    """
    serializer_class = JobResponseSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        job_id = self.kwargs.get('job_id')
        job = get_object_or_404(Job, id=job_id)
        user = self.request.user
        
        # Check permissions to view responses
        if user.user_type == 'customer' and job.customer != user:
            return JobResponse.objects.none()
        
        return JobResponse.objects.filter(job=job).select_related('worker', 'job')
    
    def perform_create(self, serializer):
        job_id = self.kwargs.get('job_id')
        job = get_object_or_404(Job, id=job_id)
        user = self.request.user
        
        print(f"DEBUG: Creating job response for job {job_id} by user {user.id} ({user.username})")
        print(f"DEBUG: User type: {user.user_type}")
        print(f"DEBUG: Job status: {job.status}")
        print(f"DEBUG: Request data: {self.request.data}")
        
        # Only workers can create responses
        if user.user_type != 'worker':
            raise PermissionDenied("Only workers can respond to jobs.")
        
        # Check if job is still open
        if job.status != 'open':
            raise PermissionDenied("Cannot respond to a closed job.")
        
        # Check if worker already responded
        if JobResponse.objects.filter(job=job, worker=user).exists():
            raise PermissionDenied("You have already responded to this job.")
        
        print(f"DEBUG: About to save job response")
        serializer.save(job=job, worker=user)
        print(f"DEBUG: Job response saved successfully")


class WorkerJobResponseListView(generics.ListAPIView):
    """
    List all job responses for the authenticated worker.
    """
    serializer_class = JobResponseSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        # Only workers can access this endpoint
        if user.user_type != 'worker':
            return JobResponse.objects.none()
        
        return JobResponse.objects.filter(worker=user).select_related('job', 'worker').order_by('-created_at')


class JobResponseDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update or delete a job response.
    """
    serializer_class = JobResponseSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        queryset = JobResponse.objects.select_related('worker', 'job')
        
        if user.user_type == 'worker':
            # Workers can only access their own responses
            return queryset.filter(worker=user)
        elif user.user_type == 'customer':
            # Customers can access responses to their jobs
            return queryset.filter(job__customer=user)
        
        return queryset.none()
    
    def perform_update(self, serializer):
        response = self.get_object()
        user = self.request.user
        
        # Only response owner can update
        if response.worker != user:
            raise PermissionDenied("You can only update your own responses.")
        
        # Prevent updates if response is accepted or job is assigned
        if response.status == 'accepted' or hasattr(response.job, 'assignment'):
            raise PermissionDenied(
                "Cannot update response that is accepted or job is assigned."
            )
        
        serializer.save()


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def accept_job_response(request, response_id):
    """
    Accept a job response and create assignment.
    Only job owner (customer) can accept responses.
    """
    response_obj = get_object_or_404(JobResponse, id=response_id)
    user = request.user
    
    # Check permissions
    if user.user_type != 'customer' or response_obj.job.customer != user:
        return Response(
            {"error": "Only job owner can accept responses."},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Check if job is still open
    if response_obj.job.status != 'open':
        return Response(
            {"error": "Cannot accept response for a closed job."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Check if job already has an assignment
    if hasattr(response_obj.job, 'assignment'):
        return Response(
            {"error": "Job is already assigned."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Create assignment
    # Determine agreed amount based on response type and job budget
    if response_obj.response_type == 'quote' and response_obj.quote_amount:
        agreed_amount = response_obj.quote_amount
    elif response_obj.job.fixed_amount:
        agreed_amount = response_obj.job.fixed_amount
    elif response_obj.job.budget_max:
        # For budget range jobs, use the maximum budget as agreed amount
        agreed_amount = response_obj.job.budget_max
    elif response_obj.job.budget_min:
        # Fallback to minimum budget if max is not set
        agreed_amount = response_obj.job.budget_min
    else:
        return Response(
            {"error": "Cannot determine agreed amount. Job must have a fixed amount or budget range."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    assignment = Assignment.objects.create(
        job=response_obj.job,
        worker=response_obj.worker,
        job_response=response_obj,
        agreed_amount=agreed_amount,
        status='assigned'
    )
    
    # Update job and response status
    response_obj.job.status = 'accepted'
    response_obj.job.save()
    
    response_obj.status = 'accepted'
    response_obj.save()
    
    # Reject other responses
    JobResponse.objects.filter(
        job=response_obj.job
    ).exclude(id=response_obj.id).update(status='rejected')
    
    serializer = AssignmentSerializer(assignment)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def update_job_status(request, job_id):
    """
    Update job status (for workflow management).
    """
    job = get_object_or_404(Job, id=job_id)
    user = request.user
    new_status = request.data.get('status')
    
    if not new_status:
        return Response(
            {"error": "Status is required."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Check permissions and valid status transitions
    if user.user_type == 'customer' and job.customer == user:
        # Customers can cancel their jobs or mark as completed
        if new_status == 'cancelled':
            # Customers can cancel jobs in any state except completed
            if job.status == 'completed':
                return Response(
                    {"error": "Cannot cancel a completed job."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            job.status = new_status
            job.save()
            
            # Update assignment if exists
            if hasattr(job, 'assignment'):
                assignment = job.assignment
                assignment.status = 'cancelled'
                assignment.cancelled_at = timezone.now()
                assignment.save()
                
        elif new_status == 'in_progress':
            # Customers can start jobs if they have an assignment
            if not hasattr(job, 'assignment'):
                return Response(
                    {"error": "Cannot start a job without an assignment."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            job.status = new_status
            job.save()
            
            assignment = job.assignment
            assignment.status = 'started'
            assignment.started_at = timezone.now()
            assignment.save()
            
        elif new_status == 'completed':
            # Customers can mark jobs as completed if they have an assignment
            if not hasattr(job, 'assignment'):
                return Response(
                    {"error": "Cannot complete a job without an assignment."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            job.status = new_status
            job.save()
            
            assignment = job.assignment
            assignment.status = 'completed'
            assignment.completed_at = timezone.now()
            # If not started yet, mark started time as well
            if not assignment.started_at:
                assignment.started_at = timezone.now()
            assignment.save()

            # Ensure a transaction/earning exists for this completed assignment
            from decimal import Decimal
            from django.conf import settings
            if not Transaction.objects.filter(assignment=assignment).exists():
                platform_fee_rate = Decimal(getattr(settings, 'PLATFORM_FEE_RATE', '0.10'))
                gross_amount = assignment.agreed_amount
                platform_fee = gross_amount * platform_fee_rate
                net_amount = gross_amount - platform_fee

                transaction = Transaction.objects.create(
                    assignment=assignment,
                    worker=assignment.worker,
                    customer=assignment.job.customer,
                    transaction_type='payment',
                    amount=gross_amount,
                    platform_fee=platform_fee,
                    payment_method='online',
                    status='pending',
                    description=f'Payment for job: {assignment.job.title}'
                )

                Earning.objects.create(
                    worker=assignment.worker,
                    transaction=transaction,
                    gross_amount=gross_amount,
                    platform_fee=platform_fee,
                    net_amount=net_amount,
                    final_amount=net_amount,
                    job_category=assignment.job.category,
                    job_duration_hours=assignment.duration_hours or 0
                )
        else:
            return Response(
                {"error": "Invalid status transition."},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    elif user.user_type == 'worker' and hasattr(job, 'assignment') and job.assignment.worker == user:
        # Workers can start or complete their assigned jobs
        assignment = job.assignment
        if new_status == 'in_progress' and assignment.status == 'assigned':
            job.status = 'in_progress'
            assignment.status = 'started'  # Assignment uses 'started' not 'in_progress'
            assignment.started_at = timezone.now()
            job.save()
            assignment.save()
        elif new_status == 'completed' and assignment.status in ['started', 'assigned']:
            job.status = 'completed'
            assignment.status = 'completed'
            assignment.completed_at = timezone.now()
            # If not started yet, mark started time as well
            if not assignment.started_at:
                assignment.started_at = timezone.now()
            job.save()
            assignment.save()
            # Ensure a transaction/earning exists when worker marks completed
            from decimal import Decimal
            from django.conf import settings
            if not Transaction.objects.filter(assignment=assignment).exists():
                platform_fee_rate = Decimal(getattr(settings, 'PLATFORM_FEE_RATE', '0.10'))
                gross_amount = assignment.agreed_amount
                platform_fee = gross_amount * platform_fee_rate
                net_amount = gross_amount - platform_fee

                transaction = Transaction.objects.create(
                    assignment=assignment,
                    worker=assignment.worker,
                    customer=assignment.job.customer,
                    transaction_type='payment',
                    amount=gross_amount,
                    platform_fee=platform_fee,
                    payment_method='online',
                    status='pending',
                    description=f'Payment for job: {assignment.job.title}'
                )

                Earning.objects.create(
                    worker=assignment.worker,
                    transaction=transaction,
                    gross_amount=gross_amount,
                    platform_fee=platform_fee,
                    net_amount=net_amount,
                    final_amount=net_amount,
                    job_category=assignment.job.category,
                    job_duration_hours=assignment.duration_hours or 0
                )
        else:
            return Response(
                {"error": "Invalid status transition."},
                status=status.HTTP_400_BAD_REQUEST
            )
    else:
        return Response(
            {"error": "Permission denied."},
            status=status.HTTP_403_FORBIDDEN
        )
    
    serializer = JobDetailSerializer(job)
    return Response(serializer.data)


class AssignmentListView(generics.ListAPIView):
    """
    List assignments for the current user.
    """
    serializer_class = AssignmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        queryset = Assignment.objects.select_related('job', 'worker', 'job__customer')
        
        if user.user_type == 'customer':
            # Customers see assignments for their jobs
            return queryset.filter(job__customer=user)
        elif user.user_type == 'worker':
            # Workers see their own assignments
            return queryset.filter(worker=user)
        
        return queryset.none()


class AssignmentDetailView(generics.RetrieveUpdateAPIView):
    """
    Retrieve or update an assignment.
    """
    serializer_class = AssignmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        queryset = Assignment.objects.select_related('job', 'worker', 'job__customer')
        
        if user.user_type == 'customer':
            return queryset.filter(job__customer=user)
        elif user.user_type == 'worker':
            return queryset.filter(worker=user)
        
        return queryset.none()
    
    def perform_update(self, serializer):
        assignment = self.get_object()
        user = self.request.user
        
        # Only allow specific field updates based on user type
        if user.user_type == 'customer' and assignment.job.customer == user:
            # Customers can update notes and cancel
            allowed_fields = ['notes', 'status', 'cancellation_reason']
        elif user.user_type == 'worker' and assignment.worker == user:
            # Workers can update notes and status
            allowed_fields = ['notes', 'status']
        else:
            raise PermissionDenied("Permission denied.")
        
        # Filter update data to only allowed fields
        update_data = {k: v for k, v in serializer.validated_data.items() if k in allowed_fields}
        
        for field, value in update_data.items():
            setattr(assignment, field, value)
        
        assignment.save()


# Earnings and Transaction Views

class TransactionListView(generics.ListAPIView):
    """
    List transactions for the authenticated user
    """
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        queryset = Transaction.objects.select_related('worker', 'customer', 'assignment__job')
        
        if user.user_type == 'worker':
            return queryset.filter(worker=user).order_by('-created_at')
        elif user.user_type == 'customer':
            return queryset.filter(customer=user).order_by('-created_at')
        
        return queryset.none()


class EarningListView(generics.ListAPIView):
    """
    List earnings for workers
    """
    serializer_class = EarningSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        if user.user_type != 'worker':
            return Earning.objects.none()
        
        return Earning.objects.filter(worker=user).select_related(
            'transaction', 'worker'
        ).order_by('-earned_at')


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def earnings_summary(request):
    """
    Get earnings summary for a worker
    """
    user = request.user
    
    if user.user_type != 'worker':
        return Response(
            {'error': 'Only workers can access earnings summary'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Calculate summary data
    earnings_qs = Earning.objects.filter(worker=user)
    
    # Total earnings
    total_earnings = earnings_qs.aggregate(
        total=Sum('final_amount')
    )['total'] or Decimal('0.00')
    # Gross total earnings (before fees)
    gross_total_earnings = earnings_qs.aggregate(
        total=Sum('gross_amount')
    )['total'] or Decimal('0.00')
    
    # This month earnings
    current_month = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    this_month_earnings = earnings_qs.filter(
        earned_at__gte=current_month
    ).aggregate(
        total=Sum('final_amount')
    )['total'] or Decimal('0.00')
    # This month gross earnings
    this_month_gross_earnings = earnings_qs.filter(
        earned_at__gte=current_month
    ).aggregate(
        total=Sum('gross_amount')
    )['total'] or Decimal('0.00')
    
    # Pending transactions
    pending_amount = Transaction.objects.filter(
        worker=user, 
        status='pending'
    ).aggregate(
        total=Sum('net_amount')
    )['total'] or Decimal('0.00')
    
    # Completed jobs count
    completed_jobs = Assignment.objects.filter(
        worker=user, 
        status='completed'
    ).count()
    
    # Average rating
    avg_rating = earnings_qs.exclude(
        customer_rating__isnull=True
    ).aggregate(
        avg=Avg('customer_rating')
    )['avg'] or Decimal('0.00')
    
    # Recent transactions (last 10)
    recent_transactions = Transaction.objects.filter(
        worker=user
    ).select_related(
        'assignment__job', 'customer'
    ).order_by('-created_at')[:10]
    
    # Monthly earnings for the last 12 months
    monthly_earnings = []
    for i in range(12):
        month_start = (timezone.now().replace(day=1) - timedelta(days=32*i)).replace(day=1)
        month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)
        
        month_total = earnings_qs.filter(
            earned_at__gte=month_start,
            earned_at__lte=month_end
        ).aggregate(
            total=Sum('final_amount')
        )['total'] or Decimal('0.00')
        
        monthly_earnings.append({
            'month': month_start.strftime('%Y-%m'),
            'month_name': month_start.strftime('%B %Y'),
            'amount': float(month_total)
        })
    
    monthly_earnings.reverse()  # Show oldest to newest
    
    # Pass queryset directly; nested serializer will handle representation.
    summary_data = {
        'total_earnings': total_earnings,
        'gross_total_earnings': gross_total_earnings,
        'this_month_earnings': this_month_earnings,
        'this_month_gross_earnings': this_month_gross_earnings,
        'pending_amount': pending_amount,
        'completed_jobs': completed_jobs,
        'average_rating': avg_rating,
        'recent_transactions': recent_transactions,
        'monthly_earnings': monthly_earnings
    }
    
    serializer = EarningsSummarySerializer(summary_data)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def create_transaction(request):
    """
    Create a transaction when a job is completed
    This would typically be called when assignment status changes to 'completed'
    """
    user = request.user
    assignment_id = request.data.get('assignment_id')
    
    if not assignment_id:
        return Response(
            {'error': 'Assignment ID is required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        assignment = Assignment.objects.get(id=assignment_id)
    except Assignment.DoesNotExist:
        return Response(
            {'error': 'Assignment not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Check if user has permission to create transaction for this assignment
    if user.user_type == 'customer' and assignment.job.customer != user:
        return Response(
            {'error': 'Permission denied'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Check if transaction already exists
    if Transaction.objects.filter(assignment=assignment).exists():
        return Response(
            {'error': 'Transaction already exists for this assignment'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Create transaction
    # Read platform fee rate from settings (string), convert to Decimal
    platform_fee_rate = Decimal(getattr(settings, 'PLATFORM_FEE_RATE', '0.10'))
    gross_amount = assignment.agreed_amount
    platform_fee = gross_amount * platform_fee_rate
    net_amount = gross_amount - platform_fee
    
    transaction = Transaction.objects.create(
        assignment=assignment,
        worker=assignment.worker,
        customer=assignment.job.customer,
        transaction_type='payment',
        amount=gross_amount,
        platform_fee=platform_fee,
        payment_method='online',
        status='pending',
        description=f'Payment for job: {assignment.job.title}'
    )
    
    # Create corresponding earning record
    earning = Earning.objects.create(
        worker=assignment.worker,
        transaction=transaction,
        gross_amount=gross_amount,
        platform_fee=platform_fee,
        net_amount=net_amount,
        final_amount=net_amount,
        job_category=assignment.job.category,
        job_duration_hours=assignment.duration_hours or 0
    )
    
    return Response(
        TransactionSerializer(transaction).data, 
        status=status.HTTP_201_CREATED
    )


# Rating Views

class RatingListCreateView(generics.ListCreateAPIView):
    """
    List ratings or create a new rating.
    GET: List ratings (filtered by user)
    POST: Create new rating
    """
    serializer_class = RatingSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        queryset = Rating.objects.select_related(
            'rater', 'ratee', 'assignment__job'
        ).prefetch_related('helpful_votes')
        
        # Filter based on query parameters
        assignment_id = self.request.query_params.get('assignment')
        ratee_id = self.request.query_params.get('ratee')
        rater_id = self.request.query_params.get('rater')
        rating_type = self.request.query_params.get('type')
        
        if assignment_id:
            queryset = queryset.filter(assignment_id=assignment_id)
        if ratee_id:
            queryset = queryset.filter(ratee_id=ratee_id)
        if rater_id:
            queryset = queryset.filter(rater_id=rater_id)
        if rating_type:
            queryset = queryset.filter(rating_type=rating_type)
        
        # Users can see ratings they gave or received
        queryset = queryset.filter(Q(rater=user) | Q(ratee=user))
        
        return queryset.order_by('-created_at')
    
    def perform_create(self, serializer):
        # The rater is automatically set to the current user in the serializer
        serializer.save()

    def create(self, request, *args, **kwargs):
        """Override create to return a consistent error payload the frontend can display.

        DRF default returns {"non_field_errors": [...]}. The frontend expects
        an 'error' or 'detail' key. We surface a concise 'error' message and include
        full validation errors for debugging.
        """
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            errors = serializer.errors
            message = None
            # Try to extract a user-friendly message
            non_field = errors.get('non_field_errors')
            if isinstance(non_field, list) and non_field:
                message = non_field[0]
            # Fallback generic message
            if not message:
                message = 'Failed to create rating'
            return Response({'error': message, 'errors': errors}, status=status.HTTP_400_BAD_REQUEST)

        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)


class RatingDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update or delete a rating.
    """
    serializer_class = RatingSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        return Rating.objects.filter(rater=user)
    
    def perform_update(self, serializer):
        # Only allow updates within 24 hours of creation
        rating = self.get_object()
        if timezone.now() - rating.created_at > timedelta(hours=24):
            raise PermissionDenied("Cannot edit rating after 24 hours")
        serializer.save()


class UserRatingsView(generics.ListAPIView):
    """
    Get ratings for a specific user (as ratee).
    """
    serializer_class = RatingListSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user_id = self.kwargs.get('user_id')
        return Rating.objects.filter(
            ratee_id=user_id
        ).select_related(
            'rater', 'assignment__job'
        ).order_by('-created_at')


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_rating_summary(request, user_id):
    """
    Get rating summary for a specific user.
    """
    try:
        from django.contrib.auth import get_user_model
        User = get_user_model()
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response(
            {'error': 'User not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Get all ratings for this user as ratee
    ratings = Rating.objects.filter(ratee=user)
    
    if not ratings.exists():
        return Response({
            'average_rating': 0,
            'total_ratings': 0,
            'rating_distribution': {str(i): 0 for i in range(1, 6)},
            'recent_ratings': []
        })
    
    # Calculate average rating
    avg_rating = ratings.aggregate(avg=Avg('rating'))['avg'] or 0
    
    # Calculate rating distribution
    rating_distribution = {}
    for i in range(1, 6):
        count = ratings.filter(rating=i).count()
        rating_distribution[str(i)] = count
    
    # Get recent ratings (last 10)
    recent_ratings = ratings.select_related(
        'rater', 'assignment__job'
    ).order_by('-created_at')[:10]
    
    return Response({
        'average_rating': round(avg_rating, 2),
        'total_ratings': ratings.count(),
        'rating_distribution': rating_distribution,
        'recent_ratings': RatingListSerializer(recent_ratings, many=True).data
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def assignment_ratings(request, assignment_id):
    """
    Get all ratings for a specific assignment.
    """
    try:
        assignment = Assignment.objects.get(id=assignment_id)
    except Assignment.DoesNotExist:
        return Response(
            {'error': 'Assignment not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Check if user has permission to view ratings for this assignment
    user = request.user
    if user not in [assignment.job.customer, assignment.worker]:
        return Response(
            {'error': 'Permission denied'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    ratings = Rating.objects.filter(assignment=assignment).select_related(
        'rater', 'ratee'
    )
    
    return Response(
        RatingSerializer(ratings, many=True, context={'request': request}).data
    )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def can_rate_assignment(request, assignment_id):
    """
    Check if the current user can rate a specific assignment.
    """
    try:
        assignment = Assignment.objects.get(id=assignment_id)
    except Assignment.DoesNotExist:
        return Response(
            {'error': 'Assignment not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    user = request.user
    
    # Check if assignment is completed
    if assignment.status != 'completed':
        return Response({
            'can_rate': False,
            'reason': 'Assignment is not completed yet'
        })
    
    # Check if user is part of this assignment
    if user not in [assignment.job.customer, assignment.worker]:
        return Response({
            'can_rate': False,
            'reason': 'You are not part of this assignment'
        })
    
    # Determine rating type and ratee
    if user == assignment.job.customer:
        rating_type = 'customer_to_worker'
        ratee = assignment.worker
    else:
        rating_type = 'worker_to_customer'
        ratee = assignment.job.customer
    
    # Check if rating already exists
    existing_rating = Rating.objects.filter(
        assignment=assignment,
        rater=user,
        ratee=ratee
    ).first()
    
    if existing_rating:
        return Response({
            'can_rate': False,
            'reason': 'You have already rated this assignment',
            'existing_rating_id': existing_rating.id
        })
    
    return Response({
        'can_rate': True,
        'rating_type': rating_type,
        'ratee_id': ratee.id,
        'ratee_name': ratee.username
    })


# Rating Helpful Views

class RatingHelpfulCreateView(generics.CreateAPIView):
    """
    Mark a rating as helpful.
    """
    serializer_class = RatingHelpfulSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        # The user is automatically set in the serializer
        serializer.save()


@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def remove_rating_helpful(request, rating_id):
    """
    Remove helpful vote from a rating.
    """
    try:
        rating = Rating.objects.get(id=rating_id)
        helpful_vote = RatingHelpful.objects.get(rating=rating, user=request.user)
        helpful_vote.delete()
        
        # Update helpful count
        rating.helpful_count = rating.helpful_votes.count()
        rating.save()
        
        return Response({'message': 'Helpful vote removed'})
    except Rating.DoesNotExist:
        return Response(
            {'error': 'Rating not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except RatingHelpful.DoesNotExist:
        return Response(
            {'error': 'Helpful vote not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
