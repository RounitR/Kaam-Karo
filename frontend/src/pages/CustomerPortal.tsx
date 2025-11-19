import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useCustomerJobs, useCreateJob, useCustomerAssignments, useAcceptJobResponse, useUpdateJobStatus, useUpdateJob, useDeleteJob } from "@/hooks/useJobs";
import { useRatings } from "@/hooks/useRatings";
import { useWorkerProfileByUserId, useCustomerProfile, useUpdateCustomerProfile } from "@/hooks/useProfile";
import { CreateJobData, Job } from "@/lib/jobs";
import RatingStars from "@/components/RatingStars";
import RatingComponent from "@/components/RatingComponent";
import UserRatingSummary from "@/components/UserRatingSummary";
import {
  PlusCircle,
  Briefcase,
  Clock,
  CheckCircle2,
  Upload,
  MapPin,
  IndianRupee,
  Loader2,
  Edit,
  Trash2,
  Star,
} from "lucide-react";

const CustomerPortal = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Rating state
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [selectedAssignmentForRating, setSelectedAssignmentForRating] = useState<any>(null);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  // Worker profile dialog state
  const [workerProfileDialogOpen, setWorkerProfileDialogOpen] = useState(false);
  const [selectedWorkerId, setSelectedWorkerId] = useState<number | null>(null);
  const [ratingForm, setRatingForm] = useState({
    rating: 5,
    review: '',
    quality_rating: 5,
    communication_rating: 5,
    punctuality_rating: 5,
    professionalism_rating: 5,
    is_anonymous: false,
  });

  // Job form state
  const [jobForm, setJobForm] = useState<CreateJobData>({
    title: "",
    description: "",
    category: "",
    budget_min: 100,
    budget_max: 500,
    location: "",
    city: "",
    state: "",
    pincode: "",
    urgency: "medium",
  });

  // API hooks
  const { data: customerJobs = [], isLoading: jobsLoading, error: jobsError } = useCustomerJobs();
  const { data: customerAssignments = [], isLoading: assignmentsLoading } = useCustomerAssignments();
  const createJobMutation = useCreateJob();
  const acceptJobResponseMutation = useAcceptJobResponse();
  const updateJobStatusMutation = useUpdateJobStatus();
  const updateJobMutation = useUpdateJob();
  const deleteJobMutation = useDeleteJob();

  // Rating hooks
  const { canRateAssignment, createRating, fetchRatings } = useRatings();

  // Worker profile hook
  const { data: workerProfileData, isLoading: workerProfileLoading, error: workerProfileError } = useWorkerProfileByUserId(selectedWorkerId);

  // Customer profile hooks
  const { data: customerProfile, isLoading: customerProfileLoading, error: customerProfileError } = useCustomerProfile();
  const updateCustomerProfileMutation = useUpdateCustomerProfile();

  // Customer profile form state
  const [customerProfileForm, setCustomerProfileForm] = useState({
    address: customerProfile?.address || "",
    bio: customerProfile?.bio || "",
    profile_picture: customerProfile?.profile_picture || "",
  });

  // Sync form when profile loads
  useEffect(() => {
    if (customerProfile) {
      setCustomerProfileForm({
        address: customerProfile.address || "",
        bio: customerProfile.bio || "",
        profile_picture: customerProfile.profile_picture || "",
      });
    }
  }, [customerProfile]);

  const handleCustomerProfileChange = (field: string, value: any) => {
    setCustomerProfileForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveCustomerProfile = async () => {
    try {
      await updateCustomerProfileMutation.mutateAsync(customerProfileForm);
      toast({ title: "Profile Updated", description: "Your profile has been saved." });
    } catch (err) {
      toast({ title: "Update Failed", description: "Could not save your profile.", variant: "destructive" });
    }
  };

  // Edit job state
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [editJobForm, setEditJobForm] = useState<CreateJobData>({
    title: "",
    description: "",
    category: "",
    budget_min: 100,
    budget_max: 500,
    location: "",
    city: "",
    state: "",
    pincode: "",
    urgency: "medium",
  });

  // Ensure customerJobs and customerAssignments are always arrays
  const safeCustomerJobs = Array.isArray(customerJobs) ? customerJobs : [];
  const safeCustomerAssignments = Array.isArray(customerAssignments) ? customerAssignments : [];
  
  // Calculate stats from real data
  // Get job IDs that have assignments (these should not be in active jobs)
  const assignedJobIds = new Set(safeCustomerAssignments.map(assignment => assignment.job));
  
  // Active jobs are only those that are open and don't have assignments yet
  const activeJobs = safeCustomerJobs.filter(job => 
    job.status === 'open' && !assignedJobIds.has(job.id)
  );
  
  // In Progress jobs are those that have been accepted by workers but not yet completed
  const inProgressAssignmentJobIds = safeCustomerAssignments
    .filter(assignment => assignment.status === 'assigned' || assignment.status === 'started')
    .map(assignment => assignment.job);
  const inProgressJobs = safeCustomerJobs.filter(job => inProgressAssignmentJobIds.includes(job.id));
  
  const completedAssignmentJobIds = safeCustomerAssignments
    .filter(assignment => assignment.status === 'completed')
    .map(assignment => assignment.job);
  const completedJobs = safeCustomerJobs.filter(job => completedAssignmentJobIds.includes(job.id));
  const totalSpent = safeCustomerAssignments
    .filter(assignment => assignment.status === 'completed' && assignment.agreed_amount)
    .reduce((sum, assignment) => sum + (typeof assignment.agreed_amount === 'string' ? parseFloat(assignment.agreed_amount) : assignment.agreed_amount || 0), 0);

  console.log('🏢 CustomerPortal data:', {
    customerJobs,
    customerJobsType: typeof customerJobs,
    isArray: Array.isArray(customerJobs),
    jobsLoading,
    jobsError,
    activeJobs: activeJobs.length,
    activeJobsData: activeJobs,
    inProgressJobs: inProgressJobs.length,
    completedJobs: completedJobs.length
  });

  const handleJobFormChange = (field: keyof CreateJobData, value: string | number) => {
    console.log(`📝 Form field changed: ${field} = ${value} (type: ${typeof value})`);
    setJobForm(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🚀 Job form submission started');
    console.log('📝 Job form data:', jobForm);
    console.log('🔐 User:', user);
    console.log('🔄 Mutation status:', {
      isPending: createJobMutation.isPending,
      isError: createJobMutation.isError,
      error: createJobMutation.error
    });
    
    if (!jobForm.title || !jobForm.description || !jobForm.category || !jobForm.location) {
      console.log('❌ Validation failed: Missing required fields');
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (jobForm.budget_min <= 0 || jobForm.budget_max <= 0) {
      console.log('❌ Validation failed: Invalid budget amounts');
      toast({
        title: "Error",
        description: "Please enter valid budget amounts greater than 0",
        variant: "destructive",
      });
      return;
    }

    if (jobForm.budget_min >= jobForm.budget_max) {
      console.log('❌ Validation failed: Budget range invalid');
      toast({
        title: "Error",
        description: "Maximum budget must be greater than minimum budget",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('✅ Validation passed, attempting to create job...');
      const result = await createJobMutation.mutateAsync(jobForm);
      console.log('🎉 Job created successfully:', result);
      
      toast({
        title: "Success",
        description: "Job posted successfully!",
      });
      
      // Reset form
      setJobForm({
        title: "",
        description: "",
        category: "",
        budget_min: 100,
        budget_max: 500,
        location: "",
        city: "",
        state: "",
        pincode: "",
        urgency: "medium",
      });
      
      // Switch to dashboard tab
      setActiveTab("dashboard");
    } catch (error) {
      console.error('💥 Job creation error:', error);
      console.error('💥 Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create job",
        variant: "destructive",
      });
    }
  };

  // Get all job responses for customer's jobs
  const allJobResponses = safeCustomerJobs.flatMap(job => 
    job.responses || []
  ).filter(response => response.status === 'pending');

  const handleAcceptWorker = async (responseId: number) => {
    try {
      await acceptJobResponseMutation.mutateAsync(responseId);
      toast({
        title: "Success",
        description: "Worker has been accepted for the job!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to accept worker",
        variant: "destructive",
      });
    }
  };

  const handleJobStatusUpdate = async (jobId: number, newStatus: Job['status']) => {
    try {
      await updateJobStatusMutation.mutateAsync({ id: jobId, status: newStatus });
      toast({
        title: "Success",
        description: `Job status updated to ${newStatus}!`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update job status",
        variant: "destructive",
      });
    }
  };

  const handleEditJob = (job: Job) => {
    setEditingJob(job);
    setEditJobForm({
      title: job.title,
      description: job.description,
      category: job.category,
      budget_min: job.budget_min,
      budget_max: job.budget_max,
      location: job.location,
      city: job.city,
      state: job.state,
      pincode: job.pincode,
      urgency: job.urgency,
    });
    setActiveTab("post-job");
  };

  const handleUpdateJob = async () => {
    if (!editingJob) return;
    
    try {
      await updateJobMutation.mutateAsync({ 
        id: editingJob.id, 
        data: editJobForm 
      });
      toast({
        title: "Success",
        description: "Job updated successfully!",
      });
      setEditingJob(null);
      setActiveTab("dashboard");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update job",
        variant: "destructive",
      });
    }
  };

  const handleDeleteJob = async (jobId: number) => {
    if (!confirm("Are you sure you want to delete this job? This action cannot be undone.")) {
      return;
    }
    
    try {
      await deleteJobMutation.mutateAsync(jobId);
      toast({
        title: "Success",
        description: "Job deleted successfully!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete job",
        variant: "destructive",
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingJob(null);
    setJobForm({
      title: "",
      description: "",
      category: "",
      budget_min: 100,
      budget_max: 500,
      location: "",
      city: "",
      state: "",
      pincode: "",
      urgency: "medium",
    });
    setActiveTab("dashboard");
  };

  // Rating handlers
  const [pendingRatingMeta, setPendingRatingMeta] = useState<{ rateeId: number; ratingType: 'customer_to_worker' | 'worker_to_customer' } | null>(null);

  const handleOpenRatingDialog = async (assignment: any) => {
    // Confirm eligibility to rate from backend
    try {
      const eligibility = await canRateAssignment(assignment.id);
      if (!eligibility.can_rate) {
        toast({
          title: 'Not eligible to rate',
          description: eligibility.reason || 'You cannot rate this assignment yet.',
          variant: 'destructive',
        });
        return;
      }

      // Use server-provided rater→ratee mapping when available
      if (eligibility.ratee_id && eligibility.rating_type) {
        setPendingRatingMeta({
          rateeId: eligibility.ratee_id,
          ratingType: eligibility.rating_type as 'customer_to_worker' | 'worker_to_customer',
        });
      } else {
        // Fallback for customers rating workers
        setPendingRatingMeta({
          rateeId: assignment.worker,
          ratingType: 'customer_to_worker',
        });
      }

      setSelectedAssignmentForRating(assignment);
      setRatingDialogOpen(true);
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to check rating eligibility',
        variant: 'destructive',
      });
    }
  };

  const handleSubmitRating = async () => {
    if (!selectedAssignmentForRating) return;

    setIsSubmittingRating(true);
    try {
      await createRating({
        assignment: selectedAssignmentForRating.id,
        ratee: pendingRatingMeta?.rateeId ?? selectedAssignmentForRating.worker,
        rating_type: pendingRatingMeta?.ratingType ?? 'customer_to_worker',
        rating: ratingForm.rating,
        review: ratingForm.review,
        quality_rating: ratingForm.quality_rating,
        communication_rating: ratingForm.communication_rating,
        punctuality_rating: ratingForm.punctuality_rating,
        professionalism_rating: ratingForm.professionalism_rating,
        is_anonymous: ratingForm.is_anonymous
      });

      toast({
        title: "Success",
        description: "Rating submitted successfully!",
      });

      setRatingDialogOpen(false);
      setSelectedAssignmentForRating(null);
      setRatingForm({
        rating: 5,
        review: "",
        quality_rating: 5,
        communication_rating: 5,
        punctuality_rating: 5,
        professionalism_rating: 5,
        is_anonymous: false
      });
      setPendingRatingMeta(null);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit rating",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingRating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Welcome back, {user?.first_name || user?.username}!
            </h1>
            <p className="text-muted-foreground">Manage your jobs and find trusted workers</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <TabsList className="grid w-full max-w-2xl grid-cols-6">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="post-job">Post Job</TabsTrigger>
              <TabsTrigger value="accepted-jobs">Accepted Jobs</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="job-responses">Responses</TabsTrigger>
              <TabsTrigger value="profile">Profile</TabsTrigger>
            </TabsList>

            {/* Dashboard Tab */}
            <TabsContent value="dashboard" className="space-y-8">
              {/* Quick Stats */}
              <div className="grid md:grid-cols-4 gap-4">
                <Card className="shadow-card">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Active Jobs</p>
                        <p className="text-2xl font-bold text-foreground">{activeJobs.length}</p>
                      </div>
                      <Briefcase className="w-8 h-8 text-primary" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-card">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">In Progress</p>
                        <p className="text-2xl font-bold text-foreground">{inProgressJobs.length}</p>
                      </div>
                      <Clock className="w-8 h-8 text-energy" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-card">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Completed</p>
                        <p className="text-2xl font-bold text-foreground">{completedJobs.length}</p>
                      </div>
                      <CheckCircle2 className="w-8 h-8 text-accent" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-card">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Total Spent</p>
                        <p className="text-2xl font-bold text-foreground">₹{totalSpent.toLocaleString()}</p>
                      </div>
                      <IndianRupee className="w-8 h-8 text-primary" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Active Jobs */}
              <div>
                <h2 className="text-2xl font-semibold text-foreground mb-4">Your Active Jobs</h2>
                {jobsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <span className="ml-2 text-muted-foreground">Loading jobs...</span>
                  </div>
                ) : jobsError ? (
                  <div className="text-center py-8">
                    <p className="text-destructive">Failed to load jobs. Please try again.</p>
                  </div>
                ) : activeJobs.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No active jobs found. Create your first job!</p>
                    <Button 
                      className="mt-4" 
                      onClick={() => setActiveTab("post-job")}
                    >
                      Post a Job
                    </Button>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-6">
                    {activeJobs.map((job) => (
                      <Card key={job.id} className="shadow-card">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="font-semibold text-lg text-foreground">{job.title}</h3>
                              <p className="text-sm text-muted-foreground">{job.location}, {job.city}</p>
                              <p className="text-sm text-muted-foreground">Posted {new Date(job.created_at).toLocaleDateString()}</p>
                            </div>
                            <Badge variant={job.urgency === 'high' ? 'destructive' : 'secondary'}>
                              {job.urgency === 'high' ? 'Urgent' : job.category}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{job.description}</p>
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-1 text-primary font-semibold">
                              <IndianRupee className="w-4 h-4" />
                              {job.budget_display || `${job.budget_min || 0}-${job.budget_max || 0}`}
                            </div>
                            <Badge variant="outline">{job.responses_count || 0} responses</Badge>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => handleEditJob(job)}
                              disabled={updateJobMutation.isPending}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Modify
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="flex-1"
                              onClick={() => handleDeleteJob(job.id)}
                              disabled={deleteJobMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Accepted Jobs */}
              <div className="mt-8">
                <h2 className="text-2xl font-semibold text-foreground mb-4">Accepted Jobs</h2>
                {assignmentsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <span className="ml-2 text-muted-foreground">Loading accepted jobs...</span>
                  </div>
                ) : safeCustomerAssignments.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
                    <p className="text-muted-foreground">No accepted jobs yet</p>
                    <p className="text-sm text-muted-foreground">Jobs accepted by workers will appear here.</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-6">
                    {safeCustomerAssignments.map((assignment) => (
                      <Card key={assignment.id} className="shadow-card">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="font-semibold text-lg text-foreground">{assignment.job_title}</h3>
                              <p className="text-sm text-muted-foreground">Worker: {assignment.worker_name}</p>
                              <p className="text-sm text-muted-foreground">Email: {assignment.worker_email}</p>
                            </div>
                            <Badge 
                              variant={
                                assignment.status === 'completed' ? 'default' :
                                assignment.status === 'started' ? 'secondary' :
                                assignment.status === 'cancelled' ? 'destructive' : 'outline'
                              }
                              className={
                                assignment.status === 'completed' 
                                  ? 'bg-green-100 text-green-800' 
                                  : assignment.status === 'started'
                                  ? 'bg-blue-100 text-blue-800'
                                  : assignment.status === 'cancelled'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }
                            >
                              {assignment.status === 'started' ? 'In Progress' : 
                               assignment.status === 'completed' ? 'Completed' :
                               assignment.status === 'cancelled' ? 'Cancelled' : 'Accepted'}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1 text-primary font-semibold">
                              <IndianRupee className="w-4 h-4" />
                              {assignment.agreed_amount?.toLocaleString() || 'Amount TBD'}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Accepted {new Date(assignment.assigned_at).toLocaleDateString()}
                            </p>
                          </div>
                          {assignment.status === 'started' && (
                            <div className="mt-4 pt-4 border-t border-border">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  // Handle mark as completed
                                  // This would need to be implemented
                                }}
                              >
                                Mark as Completed
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

            </TabsContent>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-8">
              {customerProfileLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <span className="ml-2">Loading profile...</span>
                </div>
              ) : customerProfileError ? (
                <div className="text-center py-8 text-red-500">
                  Error loading profile: {customerProfileError.message}
                </div>
              ) : (
                <>
                  <div className="grid md:grid-cols-2 gap-8">
                    <Card className="shadow-card">
                      <CardHeader>
                        <CardTitle>Personal Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="firstName">First Name</Label>
                            <Input id="firstName" value={user?.first_name || ''} disabled />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input id="lastName" value={user?.last_name || ''} disabled />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input id="email" type="email" value={user?.email || ''} disabled />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="address">Address</Label>
                          <Input
                            id="address"
                            value={customerProfileForm.address}
                            onChange={(e) => handleCustomerProfileChange('address', e.target.value)}
                            placeholder="Enter your address"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="bio">Bio</Label>
                          <Textarea
                            id="bio"
                            value={customerProfileForm.bio}
                            onChange={(e) => handleCustomerProfileChange('bio', e.target.value)}
                            placeholder="Tell workers about yourself"
                          />
                        </div>

                        {/* Profile Stats */}
                        <div className="pt-4 border-t border-border">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Jobs Posted:</span>
                              <div className="font-semibold">{customerProfile?.total_jobs_posted || 0}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Average Rating:</span>
                              <div className="flex items-center gap-1">
                                <RatingStars rating={customerProfile?.average_rating || 0} size={14} />
                                <span className="font-semibold">{(customerProfile?.average_rating && typeof customerProfile.average_rating === 'number') ? customerProfile.average_rating.toFixed(1) : '0.0'}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <Button onClick={handleSaveCustomerProfile} disabled={updateCustomerProfileMutation.isPending}>
                            {updateCustomerProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="shadow-card">
                      <CardHeader>
                        <CardTitle>Rating Summary</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {user?.id && <UserRatingSummary userId={user.id} userType="customer" />}
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}
            </TabsContent>

            {/* Post Job Tab */}
            <TabsContent value="post-job">
              <Card className="shadow-card max-w-2xl mx-auto">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {editingJob ? (
                      <>
                        <Edit className="w-6 h-6 text-primary" />
                        Edit Job
                      </>
                    ) : (
                      <>
                        <PlusCircle className="w-6 h-6 text-primary" />
                        Post a New Job
                      </>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={editingJob ? handleUpdateJob : handleCreateJob} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="title">Job Title *</Label>
                      <Input
                        id="title"
                        placeholder="e.g., Deep Cleaning for 2BHK Apartment"
                        value={editingJob ? editJobForm.title : jobForm.title}
                        onChange={(e) => editingJob ? 
                          setEditJobForm(prev => ({ ...prev, title: e.target.value })) :
                          handleJobFormChange('title', e.target.value)
                        }
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="category">Category *</Label>
                        <Select 
                          value={editingJob ? editJobForm.category : jobForm.category} 
                          onValueChange={(value) => editingJob ? 
                            setEditJobForm(prev => ({ ...prev, category: value })) :
                            handleJobFormChange('category', value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cleaning">Cleaning</SelectItem>
                            <SelectItem value="repair">Repair & Maintenance</SelectItem>
                            <SelectItem value="electrical">Electrical</SelectItem>
                            <SelectItem value="plumbing">Plumbing</SelectItem>
                            <SelectItem value="painting">Painting</SelectItem>
                            <SelectItem value="gardening">Gardening</SelectItem>
                            <SelectItem value="cooking">Cooking</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="urgency">Urgency</Label>
                        <Select 
                          value={editingJob ? editJobForm.urgency : jobForm.urgency} 
                          onValueChange={(value: 'low' | 'medium' | 'high') => editingJob ? 
                            setEditJobForm(prev => ({ ...prev, urgency: value })) :
                            handleJobFormChange('urgency', value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High (Urgent)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Job Description *</Label>
                      <Textarea
                        id="description"
                        placeholder="Describe what you need help with..."
                        className="min-h-[100px]"
                        value={editingJob ? editJobForm.description : jobForm.description}
                        onChange={(e) => editingJob ? 
                          setEditJobForm(prev => ({ ...prev, description: e.target.value })) :
                          handleJobFormChange('description', e.target.value)
                        }
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="budget_min">Min Budget (₹) *</Label>
                        <Input
                          id="budget_min"
                          type="number"
                          placeholder="500"
                          value={(editingJob ? editJobForm.budget_min : jobForm.budget_min).toString()}
                          onChange={(e) => {
                            const value = e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
                            if (editingJob) {
                              setEditJobForm(prev => ({ ...prev, budget_min: value }));
                            } else {
                              handleJobFormChange('budget_min', value);
                            }
                          }}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="budget_max">Max Budget (₹) *</Label>
                        <Input
                          id="budget_max"
                          type="number"
                          placeholder="1000"
                          value={(editingJob ? editJobForm.budget_max : jobForm.budget_max).toString()}
                          onChange={(e) => {
                            const value = e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
                            if (editingJob) {
                              setEditJobForm(prev => ({ ...prev, budget_max: value }));
                            } else {
                              handleJobFormChange('budget_max', value);
                            }
                          }}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location">Location *</Label>
                      <Input
                        id="location"
                        placeholder="e.g., Andheri West"
                        value={editingJob ? editJobForm.location : jobForm.location}
                        onChange={(e) => editingJob ? 
                          setEditJobForm(prev => ({ ...prev, location: e.target.value })) :
                          handleJobFormChange('location', e.target.value)
                        }
                        required
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">City *</Label>
                        <Input
                          id="city"
                          placeholder="Mumbai"
                          value={editingJob ? editJobForm.city : jobForm.city}
                          onChange={(e) => editingJob ? 
                            setEditJobForm(prev => ({ ...prev, city: e.target.value })) :
                            handleJobFormChange('city', e.target.value)
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">State *</Label>
                        <Input
                          id="state"
                          placeholder="Maharashtra"
                          value={editingJob ? editJobForm.state : jobForm.state}
                          onChange={(e) => editingJob ? 
                            setEditJobForm(prev => ({ ...prev, state: e.target.value })) :
                            handleJobFormChange('state', e.target.value)
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="pincode">Pincode *</Label>
                        <Input
                          id="pincode"
                          placeholder="400053"
                          value={editingJob ? editJobForm.pincode : jobForm.pincode}
                          onChange={(e) => editingJob ? 
                            setEditJobForm(prev => ({ ...prev, pincode: e.target.value })) :
                            handleJobFormChange('pincode', e.target.value)
                          }
                          required
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button 
                        type="submit" 
                        className="flex-1" 
                        size="lg"
                        disabled={editingJob ? updateJobMutation.isPending : createJobMutation.isPending}
                      >
                        {editingJob ? (
                          updateJobMutation.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Updating Job...
                            </>
                          ) : (
                            'Update Job'
                          )
                        ) : (
                          createJobMutation.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Posting Job...
                            </>
                          ) : (
                            'Post Job'
                          )
                        )}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="lg"
                        onClick={editingJob ? handleCancelEdit : () => setActiveTab("dashboard")}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Accepted Jobs Tab */}
            <TabsContent value="accepted-jobs">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="w-6 h-6 text-primary" />
                    Accepted Jobs ({safeCustomerAssignments.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {assignmentsLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  ) : safeCustomerAssignments.length > 0 ? (
                    <div className="space-y-4">
                      {safeCustomerAssignments.map((assignment) => (
                        <Card key={assignment.id} className="border border-border">
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <h3 className="font-semibold text-lg">{assignment.job_title}</h3>
                                <p className="text-sm text-muted-foreground">
                                  Worker: {assignment.worker_name}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Email: {assignment.worker_email}
                                </p>
                                <p className="text-sm font-medium text-primary">
                                  Agreed Amount: ₹{assignment.agreed_amount?.toLocaleString()}
                                </p>
                              </div>
                              <div className="text-right">
                                <Badge 
                                  variant={
                                    assignment.status === 'completed' ? 'default' :
                                    assignment.status === 'started' ? 'secondary' :
                                    assignment.status === 'cancelled' ? 'destructive' : 'outline'
                                  }
                                >
                                  {assignment.status === 'assigned' ? 'Assigned' :
                                   assignment.status === 'started' ? 'In Progress' :
                                   assignment.status === 'completed' ? 'Completed' :
                                   assignment.status === 'cancelled' ? 'Cancelled' : assignment.status}
                                </Badge>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Assigned: {new Date(assignment.assigned_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            
                            {assignment.notes && (
                              <div className="mb-4">
                                <p className="text-sm text-muted-foreground">
                                  <strong>Notes:</strong> {assignment.notes}
                                </p>
                              </div>
                            )}
                            
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" className="flex-1">
                                Contact Worker
                              </Button>
                              {assignment.status === 'completed' && (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="flex-1"
                                  onClick={() => handleOpenRatingDialog(assignment)}
                                >
                                  Rate & Review
                                </Button>
                              )}
                              {assignment.status === 'assigned' && (
                                <Button 
                                  variant="default" 
                                  size="sm" 
                                  className="flex-1"
                                  onClick={() => handleJobStatusUpdate(assignment.job, 'in_progress')}
                                  disabled={updateJobStatusMutation.isPending}
                                >
                                  Start Job
                                </Button>
                              )}
                              {assignment.status === 'started' && (
                                <Button 
                                  variant="default" 
                                  size="sm" 
                                  className="flex-1"
                                  onClick={() => handleJobStatusUpdate(assignment.job, 'completed')}
                                  disabled={updateJobStatusMutation.isPending}
                                >
                                  Mark Complete
                                </Button>
                              )}
                              {(assignment.status === 'assigned' || assignment.status === 'started') && (
                                <Button 
                                  variant="destructive" 
                                  size="sm" 
                                  className="flex-1"
                                  onClick={() => handleJobStatusUpdate(assignment.job, 'cancelled')}
                                  disabled={updateJobStatusMutation.isPending}
                                >
                                  Cancel Job
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No accepted jobs yet</p>
                      <p className="text-sm">Jobs you accept workers for will appear here.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-6 h-6 text-primary" />
                    Job History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {jobsLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  ) : jobsError ? (
                    <div className="text-center py-8 text-red-500">
                      Error loading job history
                    </div>
                  ) : completedJobs.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No completed jobs yet</p>
                      <p className="text-sm">Completed jobs will appear here once they're finished.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {completedJobs.map((job) => (
                        <div
                          key={job.id}
                          className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="font-semibold text-lg">{job.title}</h3>
                              <p className="text-sm text-muted-foreground capitalize">
                                {job.category} • {job.location}, {job.city}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Completed
                              </span>
                              <p className="text-sm text-muted-foreground mt-1">
                                ₹{job.budget_min || 0} - ₹{job.budget_max || 0}
                              </p>
                            </div>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {job.description}
                          </p>
                          
                          <div className="flex justify-between items-center text-xs text-muted-foreground">
                            <span>Posted {new Date(job.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Job Responses Tab */}
            <TabsContent value="job-responses">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-6 h-6 text-primary" />
                    Job Responses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    // Get all jobs that have responses
                    const jobsWithResponses = safeCustomerJobs.filter(job => 
                      job.responses && job.responses.length > 0
                    );
                    
                    return jobsWithResponses.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No job responses yet</p>
                        <p className="text-sm">Worker responses to your jobs will appear here.</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {jobsWithResponses.map((job) => (
                          <div key={job.id} className="border border-border rounded-lg p-6">
                            <div className="mb-4">
                              <div className="flex justify-between items-start mb-2">
                                <h3 className="text-lg font-semibold text-foreground">{job.title}</h3>
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    job.status === 'completed'
                                      ? 'bg-green-100 text-green-800'
                                      : job.status === 'in_progress'
                                      ? 'bg-blue-100 text-blue-800'
                                      : job.status === 'accepted'
                                      ? 'bg-purple-100 text-purple-800'
                                      : 'bg-yellow-100 text-yellow-800'
                                  }`}
                                >
                                  {job.status === 'in_progress' ? 'In Progress' : 
                                   job.status === 'completed' ? 'Completed' :
                                   job.status === 'accepted' ? 'Accepted' : 'Open'}
                                </span>
                              </div>
                              <p className="text-muted-foreground mb-2">{job.description}</p>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span>Budget: ₹{job.budget_min} - ₹{job.budget_max}</span>
                                <span>Location: {job.location}</span>
                                <span>Posted: {new Date(job.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                            
                            <div className="space-y-3">
                              <h4 className="font-medium text-foreground">Worker Responses ({job.responses?.length || 0})</h4>
                              {job.responses?.map((response) => (
                                <Card key={response.id} className="border border-border">
                                  <CardContent className="p-4">
                                    <div className="flex items-start justify-between mb-3">
                                      <div>
                                        <h5 className="font-medium text-foreground">
                                          {response.worker_name || `Worker #${response.worker}`}
                                        </h5>
                                        <p className="text-sm text-muted-foreground">
                                          Response Type: <span className="capitalize">{response.response_type}</span>
                                        </p>
                                        {response.quote_amount && (
                                          <p className="text-sm font-medium text-primary">
                                            Quote: ₹{response.quote_amount.toLocaleString()}
                                          </p>
                                        )}
                                      </div>
                                      <Badge 
                                        variant={response.status === 'accepted' ? 'default' : 'secondary'}
                                        className={
                                          response.status === 'accepted' 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-yellow-100 text-yellow-800'
                                        }
                                      >
                                        {response.status}
                                      </Badge>
                                    </div>
                                    
                                    {response.message && (
                                      <div className="mb-3">
                                        <p className="text-sm text-muted-foreground mb-1">Message:</p>
                                        <p className="text-sm text-foreground bg-muted p-2 rounded">
                                          {response.message}
                                        </p>
                                      </div>
                                    )}
                                    
                                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                                      <span>Responded: {new Date(response.created_at).toLocaleDateString()}</span>
                                    </div>
                                    
                                    {response.status === 'pending' && (
                                      <div className="flex gap-2">
                                        <Button 
                                          size="sm" 
                                          className="flex-1"
                                          onClick={() => handleAcceptWorker(response.id)}
                                          disabled={acceptJobResponseMutation.isPending}
                                        >
                                          {acceptJobResponseMutation.isPending ? 'Accepting...' : 'Accept Worker'}
                                        </Button>
                                        <Button 
                                          variant="outline" 
                                          size="sm" 
                                          className="flex-1"
                                          onClick={() => {
                                            setSelectedWorkerId(response.worker);
                                            setWorkerProfileDialogOpen(true);
                                          }}
                                        >
                                          View Profile
                                        </Button>
                                      </div>
                                    )}
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Rating Dialog */}
      <Dialog open={ratingDialogOpen} onOpenChange={setRatingDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Rate & Review</DialogTitle>
            <DialogDescription>
              Share feedback for the completed assignment. Your overall rating must be between 1 and 5.
            </DialogDescription>
          </DialogHeader>
          {selectedAssignmentForRating && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  Rating for: {selectedAssignmentForRating.worker_name}
                </p>
                <p className="font-medium">{selectedAssignmentForRating.job_title}</p>
              </div>
              
              <div className="space-y-4">
                <div>
                   <Label>Overall Rating</Label>
                   <div className="flex items-center gap-2 mt-1">
                     <div className="flex gap-1">
                       {Array.from({ length: 5 }).map((_, index) => (
                         <button
                           key={index}
                           type="button"
                           onClick={() => setRatingForm(prev => ({ ...prev, rating: index + 1 }))}
                           className="focus:outline-none"
                         >
                           <Star
                             className={`w-5 h-5 ${
                               index < ratingForm.rating
                                 ? "fill-energy text-energy"
                                 : "fill-muted text-muted"
                             }`}
                           />
                         </button>
                       ))}
                     </div>
                     <span className="text-sm text-muted-foreground">({ratingForm.rating}/5)</span>
                   </div>
                 </div>

                <div>
                  <Label>Quality Rating</Label>
                  <div className="mt-2">
                    <Slider
                      value={[ratingForm.quality_rating]}
                      onValueChange={(value) => setRatingForm(prev => ({ ...prev, quality_rating: value[0] }))}
                      max={5}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Poor</span>
                      <span>Excellent</span>
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Communication Rating</Label>
                  <div className="mt-2">
                    <Slider
                      value={[ratingForm.communication_rating]}
                      onValueChange={(value) => setRatingForm(prev => ({ ...prev, communication_rating: value[0] }))}
                      max={5}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Poor</span>
                      <span>Excellent</span>
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Punctuality Rating</Label>
                  <div className="mt-2">
                    <Slider
                      value={[ratingForm.punctuality_rating]}
                      onValueChange={(value) => setRatingForm(prev => ({ ...prev, punctuality_rating: value[0] }))}
                      max={5}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Poor</span>
                      <span>Excellent</span>
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Professionalism Rating</Label>
                  <div className="mt-2">
                    <Slider
                      value={[ratingForm.professionalism_rating]}
                      onValueChange={(value) => setRatingForm(prev => ({ ...prev, professionalism_rating: value[0] }))}
                      max={5}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Poor</span>
                      <span>Excellent</span>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="review">Review (Optional)</Label>
                  <Textarea
                    id="review"
                    placeholder="Share your experience working with this person..."
                    value={ratingForm.review}
                    onChange={(e) => setRatingForm(prev => ({ ...prev, review: e.target.value }))}
                    className="mt-1"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="anonymous"
                    checked={ratingForm.is_anonymous}
                    onChange={(e) => setRatingForm(prev => ({ ...prev, is_anonymous: e.target.checked }))}
                  />
                  <Label htmlFor="anonymous" className="text-sm">
                    Submit anonymously
                  </Label>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setRatingDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                   onClick={handleSubmitRating}
                   disabled={isSubmittingRating}
                   className="flex-1"
                 >
                   {isSubmittingRating ? (
                     <>
                       <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                       Submitting...
                     </>
                   ) : (
                     'Submit Rating'
                   )}
                 </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Worker Profile Dialog */}
      <Dialog open={workerProfileDialogOpen} onOpenChange={setWorkerProfileDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Worker Profile</DialogTitle>
          </DialogHeader>
          
          {workerProfileLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              Loading profile...
            </div>
          )}
          
          {workerProfileError && (
            <div className="text-red-500 text-center py-4">
              Error loading profile: {workerProfileError.message}
            </div>
          )}
          
          {workerProfileData && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-xl font-semibold text-blue-600">
                    {workerProfileData.user.first_name?.[0]}{workerProfileData.user.last_name?.[0]}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">
                    {workerProfileData.user.first_name} {workerProfileData.user.last_name}
                  </h3>
                  <p className="text-muted-foreground">{workerProfileData.user.email}</p>
                 </div>
               </div>
 
               {/* Address */}
               {workerProfileData.profile.address && (
                 <div>
                   <h4 className="font-semibold mb-2 flex items-center">
                     <MapPin className="w-4 h-4 mr-2" />
                     Address
                   </h4>
                   <p className="text-muted-foreground">{workerProfileData.profile.address}</p>
                 </div>
               )}

              {/* Skills */}
              {workerProfileData.profile.skills && workerProfileData.profile.skills.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {workerProfileData.profile.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Experience */}
               {workerProfileData.profile.experience_years && (
                 <div>
                   <h4 className="font-semibold mb-2">Experience</h4>
                   <p className="text-muted-foreground">{workerProfileData.profile.experience_years} years</p>
                 </div>
               )}

              {/* Bio */}
              {workerProfileData.profile.bio && (
                <div>
                  <h4 className="font-semibold mb-2">About</h4>
                  <p className="text-muted-foreground">{workerProfileData.profile.bio}</p>
                </div>
              )}

              {/* Hourly Rate */}
              {workerProfileData.profile.hourly_rate && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center">
                    <IndianRupee className="w-4 h-4 mr-2" />
                    Hourly Rate
                  </h4>
                  <p className="text-muted-foreground">₹{workerProfileData.profile.hourly_rate}/hour</p>
                </div>
              )}

              {/* Availability */}
               <div>
                 <h4 className="font-semibold mb-2">Availability</h4>
                 <Badge variant={workerProfileData.profile.is_available ? 'default' : 'secondary'}>
                   {workerProfileData.profile.is_available ? 'Available' : 'Not Available'}
                 </Badge>
               </div>

              {/* Ratings Summary */}
              <div>
                <h4 className="font-semibold mb-2">Ratings</h4>
                {selectedWorkerId && <UserRatingSummary userId={selectedWorkerId} />}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default CustomerPortal;
