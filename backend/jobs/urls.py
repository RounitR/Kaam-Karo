from django.urls import path
from . import views

app_name = 'jobs'

urlpatterns = [
    # Job endpoints
    path('jobs/', views.JobListCreateView.as_view(), name='job-list-create'),
    path('jobs/<int:pk>/', views.JobDetailView.as_view(), name='job-detail'),
    path('jobs/<int:job_id>/status/', views.update_job_status, name='job-status-update'),
    
    # Job Response endpoints
    path('jobs/<int:job_id>/responses/', views.JobResponseListCreateView.as_view(), name='job-response-list-create'),
    path('responses/<int:pk>/', views.JobResponseDetailView.as_view(), name='job-response-detail'),
    path('responses/<int:response_id>/accept/', views.accept_job_response, name='accept-job-response'),
    path('worker/responses/', views.WorkerJobResponseListView.as_view(), name='worker-job-responses'),
    
    # Assignment endpoints
    path('assignments/', views.AssignmentListView.as_view(), name='assignment-list'),
    path('assignments/<int:pk>/', views.AssignmentDetailView.as_view(), name='assignment-detail'),
    
    # Earnings and Transaction endpoints
    path('transactions/', views.TransactionListView.as_view(), name='transaction-list'),
    path('earnings/', views.EarningListView.as_view(), name='earning-list'),
    path('earnings/summary/', views.earnings_summary, name='earnings-summary'),
    path('transactions/create/', views.create_transaction, name='create-transaction'),
    
    # Rating endpoints
    path('ratings/', views.RatingListCreateView.as_view(), name='rating-list-create'),
    path('ratings/<int:pk>/', views.RatingDetailView.as_view(), name='rating-detail'),
    path('users/<int:user_id>/ratings/', views.UserRatingsView.as_view(), name='user-ratings'),
    path('users/<int:user_id>/rating-summary/', views.user_rating_summary, name='user-rating-summary'),
    path('assignments/<int:assignment_id>/ratings/', views.assignment_ratings, name='assignment-ratings'),
    path('assignments/<int:assignment_id>/can-rate/', views.can_rate_assignment, name='can-rate-assignment'),
    
    # Rating helpful endpoints
    path('ratings/helpful/', views.RatingHelpfulCreateView.as_view(), name='rating-helpful-create'),
    path('ratings/<int:rating_id>/helpful/', views.remove_rating_helpful, name='rating-helpful-remove'),
]