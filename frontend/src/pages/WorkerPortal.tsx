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
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import JobCard from "@/components/JobCard";
import RatingStars from "@/components/RatingStars";
import { useAuth } from "@/contexts/AuthContext";
import { useNearbyJobs, useWorkerAssignments, useCreateJobResponse, useWorkerJobResponses, useUpdateAssignment, useUpdateJobResponse, useDeleteJobResponse } from "@/hooks/useJobs";
import { useWorkerProfile, useUpdateWorkerProfile } from "@/hooks/useProfile";
import { useEarnings } from "@/hooks/useEarnings";
import { useRatings } from "@/hooks/useRatings";
import {
  User,
  Wallet,
  Bell,
  CheckCircle2,
  Clock,
  Upload,
  MapPin,
  IndianRupee,
  TrendingUp,
  Loader2,
  Edit,
  Trash2,
  Star,
} from "lucide-react";

const WorkerPortal = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("jobs");
  const [isAvailable, setIsAvailable] = useState(true);
  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [quoteAmount, setQuoteAmount] = useState("");
  const [quoteMessage, setQuoteMessage] = useState("");
  
  // Edit response state
  const [editingResponseId, setEditingResponseId] = useState<number | null>(null);
  const [editQuoteAmount, setEditQuoteAmount] = useState("");
  const [editQuoteMessage, setEditQuoteMessage] = useState("");

  // Hooks
  const { data: nearbyJobs, isLoading: jobsLoading, error: jobsError } = useNearbyJobs();
  const { data: assignments, isLoading: assignmentsLoading } = useWorkerAssignments();
  const createJobResponse = useCreateJobResponse();
  const { data: workerResponses, isLoading: responsesLoading, error: responsesError } = useWorkerJobResponses();
  const updateAssignmentMutation = useUpdateAssignment();
  const updateJobResponseMutation = useUpdateJobResponse();
  const deleteJobResponseMutation = useDeleteJobResponse();
  
  // Profile hooks
  const { data: workerProfile, isLoading: profileLoading, error: profileError } = useWorkerProfile();
  const updateProfileMutation = useUpdateWorkerProfile();
  
  // Earnings hooks
  const { 
    earnings, 
    transactions, 
    earningsSummary, 
    loading: earningsLoading, 
    error: earningsError,
    createTransaction 
  } = useEarnings();

  // Rating hooks
  const { canRateAssignment, createRating } = useRatings();

  // Rating dialog state
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [ratingForm, setRatingForm] = useState({
    rating: 0,
    quality_rating: 3,
    communication_rating: 3,
    punctuality_rating: 3,
    professionalism_rating: 3,
    review: '',
    is_anonymous: false,
  });

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    skills: workerProfile?.skills || [],
    hourly_rate: workerProfile?.hourly_rate || 0,
    experience_years: workerProfile?.experience_years || 0,
    address: workerProfile?.address || '',
    bio: workerProfile?.bio || '',
    is_available: workerProfile?.is_available || true,
    profile_picture: workerProfile?.profile_picture || '',
  });

  // Update profile form when profile data loads
  useEffect(() => {
    if (workerProfile) {
      setProfileForm({
        skills: workerProfile.skills || [],
        hourly_rate: workerProfile.hourly_rate || 0,
        experience_years: workerProfile.experience_years || 0,
        address: workerProfile.address || '',
        bio: workerProfile.bio || '',
        is_available: workerProfile.is_available || true,
        profile_picture: workerProfile.profile_picture || '',
      });
    }
  }, [workerProfile]);

  // Safe data handling
  const safeNearbyJobs = nearbyJobs || [];
  const safeAssignments = assignments || [];
  const safeWorkerResponses = workerResponses || [];

  // Get job IDs that the worker has already responded to
  const respondedJobIds = new Set(safeWorkerResponses.map(response => response.job));
  
  // Filter out jobs that have already been responded to
  const availableJobs = safeNearbyJobs.filter(job => !respondedJobIds.has(job.id));

  // Filter responses
  const acceptedJobs = safeWorkerResponses.filter(response => 
    response.response_type === 'accept' && response.status === 'pending'
  );
  const quotedJobs = safeWorkerResponses.filter(response => 
    response.response_type === 'quote' && response.status === 'pending'
  );

  // Calculate stats from real data
  const activeAssignments = safeAssignments.filter(assignment => 
    ['assigned', 'started'].includes(assignment.status)
  );
  const completedAssignments = safeAssignments.filter(assignment => 
    assignment.status === 'completed'
  );
  // Use real earnings data from the useEarnings hook
  // Show gross totals to match job amount expectations
  const totalEarnings = earningsSummary?.gross_total_earnings || 0;

  const handleJobAction = async (jobId: number, action: 'accept' | 'quote', amount?: number, message?: string) => {
    try {
      const data = {
        response_type: action,
        quote_amount: amount,
        message: message || '',
      };
      
      await createJobResponse.mutateAsync({ jobId, data });
      
      toast({
        title: action === 'accept' ? 'Job Accepted!' : 'Quote Sent!',
        description: action === 'accept' 
          ? 'You have successfully accepted this job.' 
          : 'Your quote has been sent to the customer.',
      });
    } catch (error) {
      console.error('Job action error:', error);
      toast({
        title: 'Error',
        description: `Failed to ${action} job. Please try again.`,
        variant: 'destructive',
      });
    }
  };

  const handleAssignmentStatusUpdate = async (assignmentId: number, newStatus: 'started' | 'completed') => {
    try {
      const updateData: any = { status: newStatus };
      
      if (newStatus === 'started') {
        updateData.started_at = new Date().toISOString();
      } else if (newStatus === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }
      
      await updateAssignmentMutation.mutateAsync({ id: assignmentId, data: updateData });
      
      // When an assignment is completed, create a corresponding transaction/earning
      if (newStatus === 'completed') {
        try {
          const tx = await createTransaction(assignmentId);
          if (tx) {
            toast({
              title: "Earnings Updated",
              description: "Transaction created and earnings refreshed.",
            });
          }
        } catch (e) {
          console.error('Failed to create transaction for completed assignment', e);
          toast({
            title: 'Transaction Error',
            description: e instanceof Error ? e.message : 'Could not create transaction',
            variant: 'destructive',
          });
        }
      }
      
      toast({
        title: "Success",
        description: `Assignment ${newStatus === 'started' ? 'started' : 'completed'} successfully!`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update assignment status",
        variant: "destructive",
      });
    }
  };

  const handleQuoteSubmit = () => {
    if (!selectedJobId || !quoteAmount) {
      toast({
        title: 'Error',
        description: 'Please enter a quote amount.',
        variant: 'destructive',
      });
      return;
    }

    const amount = parseFloat(quoteAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: 'Error',
        description: 'Please enter a valid quote amount.',
        variant: 'destructive',
      });
      return;
    }

    handleJobAction(selectedJobId, 'quote', amount, quoteMessage);
    setQuoteDialogOpen(false);
    setSelectedJobId(null);
    setQuoteAmount('');
    setQuoteMessage('');
  };

  const openQuoteDialog = (jobId: number) => {
    setSelectedJobId(jobId);
    setQuoteDialogOpen(true);
  };

  // Profile form handlers
  const handleProfileFormChange = (field: string, value: any) => {
    setProfileForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSkillAdd = (skill: string) => {
    if (skill && !profileForm.skills.includes(skill)) {
      setProfileForm(prev => ({ 
        ...prev, 
        skills: [...prev.skills, skill] 
      }));
    }
  };

  const handleSkillRemove = (skillToRemove: string) => {
    setProfileForm(prev => ({ 
      ...prev, 
      skills: prev.skills.filter(skill => skill !== skillToRemove) 
    }));
  };

  const handleProfileSave = async () => {
    try {
      await updateProfileMutation.mutateAsync(profileForm);
      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update profile",
        variant: "destructive",
      });
    }
  };

  const handleProfileCancel = () => {
    if (workerProfile) {
      setProfileForm({
        skills: workerProfile.skills || [],
        hourly_rate: workerProfile.hourly_rate || 0,
        experience_years: workerProfile.experience_years || 0,
        address: workerProfile.address || '',
        bio: workerProfile.bio || '',
        is_available: workerProfile.is_available || true,
        profile_picture: workerProfile.profile_picture || '',
      });
    }
  };

  const handleEditResponse = (response: any) => {
    setEditingResponseId(response.id);
    setEditQuoteAmount(response.quote_amount?.toString() || '');
    setEditQuoteMessage(response.message || '');
  };

  const handleUpdateResponse = async () => {
    if (!editingResponseId) return;

    try {
      const amount = parseFloat(editQuoteAmount);
      if (isNaN(amount) || amount <= 0) {
        toast({
          title: 'Error',
          description: 'Please enter a valid quote amount.',
          variant: 'destructive',
        });
        return;
      }

      await updateJobResponseMutation.mutateAsync({
        responseId: editingResponseId,
        data: {
          quote_amount: amount,
          message: editQuoteMessage,
        },
      });

      toast({
        title: 'Success',
        description: 'Quote updated successfully!',
      });

      setEditingResponseId(null);
      setEditQuoteAmount('');
      setEditQuoteMessage('');
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update quote',
        variant: 'destructive',
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingResponseId(null);
    setEditQuoteAmount('');
    setEditQuoteMessage('');
  };

  const handleDeleteResponse = async (responseId: number) => {
    if (!confirm('Are you sure you want to cancel this quote? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteJobResponseMutation.mutateAsync(responseId);
      toast({
        title: 'Success',
        description: 'Quote cancelled successfully!',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to cancel quote',
        variant: 'destructive',
      });
    }
  };

  // Rating handlers
  const [pendingRatingMeta, setPendingRatingMeta] = useState<{ rateeId: number; ratingType: 'customer_to_worker' | 'worker_to_customer' } | null>(null);

  const handleOpenRatingDialog = async (assignment: any) => {
    // Check server-side eligibility first to avoid confusing failures on submit
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

      // Store meta from eligibility to ensure correct rater→ratee relationship
      if (eligibility.ratee_id && eligibility.rating_type) {
        setPendingRatingMeta({
          rateeId: eligibility.ratee_id,
          ratingType: eligibility.rating_type as 'customer_to_worker' | 'worker_to_customer',
        });
      } else {
        // Fallback for workers rating customers
        setPendingRatingMeta({
          rateeId: assignment.customer,
          ratingType: 'worker_to_customer',
        });
      }

      setSelectedAssignment(assignment);
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
    if (!selectedAssignment || ratingForm.rating === 0) {
      toast({
        title: 'Error',
        description: 'Please provide an overall rating',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmittingRating(true);
    try {
      await createRating({
        assignment: selectedAssignment.id,
        ratee: pendingRatingMeta?.rateeId ?? selectedAssignment.customer,
        rating_type: pendingRatingMeta?.ratingType ?? 'worker_to_customer',
        rating: ratingForm.rating,
        quality_rating: ratingForm.quality_rating,
        communication_rating: ratingForm.communication_rating,
        punctuality_rating: ratingForm.punctuality_rating,
        professionalism_rating: ratingForm.professionalism_rating,
        review: ratingForm.review,
        is_anonymous: ratingForm.is_anonymous,
      });

      toast({
        title: 'Success',
        description: 'Rating submitted successfully!',
      });

      // Reset form and close dialog
      setRatingForm({
        rating: 0,
        quality_rating: 0,
        communication_rating: 0,
        punctuality_rating: 0,
        professionalism_rating: 0,
        review: '',
        is_anonymous: false,
      });
      setRatingDialogOpen(false);
      setSelectedAssignment(null);
      setPendingRatingMeta(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to submit rating',
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingRating(false);
    }
  };

  if (!user) {
    return <div>Please log in to access the worker portal.</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Worker Dashboard</h1>
              <p className="text-muted-foreground">Welcome back, {user.first_name}!</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={isAvailable}
                  onCheckedChange={setIsAvailable}
                  id="availability"
                />
                <Label htmlFor="availability" className="text-sm">
                  {isAvailable ? "Available for work" : "Not available"}
                </Label>
              </div>
              <Button variant="outline" size="sm">
                <Bell className="w-4 h-4 mr-2" />
                Notifications
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card className="shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Nearby Jobs</p>
                    <p className="text-3xl font-bold text-foreground">{availableJobs.length}</p>
                  </div>
                  <MapPin className="w-8 h-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Active Jobs</p>
                    <p className="text-3xl font-bold text-foreground">{activeAssignments.length}</p>
                  </div>
                  <CheckCircle2 className="w-8 h-8 text-accent" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Completed</p>
                    <p className="text-3xl font-bold text-foreground">{completedAssignments.length}</p>
                  </div>
                  <User className="w-8 h-8 text-energy" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-muted-foreground mb-1">Total Earned</p>
                    <p className="text-3xl font-bold text-foreground">₹{totalEarnings.toLocaleString()}</p>
                  </div>
                  <div className="flex-shrink-0 ml-2">
                    <IndianRupee className="w-8 h-8 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="jobs">Jobs Near You</TabsTrigger>
              <TabsTrigger value="accepted">Accepted</TabsTrigger>
              <TabsTrigger value="active">Active Jobs</TabsTrigger>
              <TabsTrigger value="earnings">Earnings</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="profile">Profile</TabsTrigger>
            </TabsList>

            {/* Jobs Tab */}
            <TabsContent value="jobs" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-foreground">Jobs Near You</h2>
                <Button variant="outline" size="sm">
                  <MapPin className="w-4 h-4 mr-2" />
                  Within 5km
                </Button>
              </div>

              {jobsLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              ) : jobsError ? (
                <div className="text-center py-8 text-red-500">
                  Error loading jobs: {jobsError.message}
                </div>
              ) : availableJobs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <MapPin className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-lg font-medium mb-2">No jobs available nearby</h3>
                  <p>Check back later for new opportunities in your area.</p>
                </div>
              ) : (
                <div className="grid gap-6">
                  {availableJobs.map((job) => (
                    <div key={job.id} className="p-6 border border-border rounded-lg bg-card">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-foreground mb-2">{job.title}</h3>
                          <p className="text-muted-foreground mb-2">{job.description}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {job.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <IndianRupee className="w-4 h-4" />
                              {job.budget_display || `₹${job.budget_min}-${job.budget_max}`}
                            </span>
                          </div>
                        </div>
                        <Badge variant="outline">{job.category}</Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => handleJobAction(job.id, 'accept')}
                          className="flex-1"
                        >
                          Accept Job
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => openQuoteDialog(job.id)}
                          className="flex-1"
                        >
                          Send Quote
                        </Button>
                      </div>
                    </div>
                  ))}
                  <div className="text-center py-6">
                    <Button variant="outline">
                      Load More Jobs
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Accepted Jobs Tab */}
            <TabsContent value="accepted" className="space-y-6">
              <div className="grid gap-6">
                {/* Accepted Jobs Section */}
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      Accepted Jobs ({acceptedJobs.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {responsesLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin" />
                      </div>
                    ) : acceptedJobs.length > 0 ? (
                      <div className="space-y-4">
                        {acceptedJobs.map((response) => (
                          <div key={response.id} className="p-4 border border-border rounded-lg">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="font-semibold text-foreground">{response.job_title}</h4>
                                <p className="text-sm text-muted-foreground">
                                  Job ID: {response.job}
                                </p>
                              </div>
                              <Badge variant="default">Accepted</Badge>
                            </div>
                            {response.message && (
                              <div className="mt-2">
                                <p className="text-sm text-muted-foreground">
                                  <strong>Your message:</strong> "{response.message}"
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                        <p>No accepted jobs yet.</p>
                        <p className="text-sm">Jobs you accept will appear here.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Quoted Jobs Section */}
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-blue-600" />
                      Quotes Sent ({quotedJobs.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {quotedJobs.length > 0 ? (
                      <div className="space-y-4">
                        {quotedJobs.map((response) => (
                          <div key={response.id} className="p-4 border border-border rounded-lg">
                            {editingResponseId === response.id ? (
                              // Edit mode
                              <div className="space-y-4">
                                <div className="flex items-start justify-between mb-2">
                                  <div>
                                    <h4 className="font-semibold text-foreground">{response.job_title}</h4>
                                    <p className="text-sm text-muted-foreground">
                                      Job ID: {response.job}
                                    </p>
                                  </div>
                                  <Badge variant="outline">Editing Quote</Badge>
                                </div>
                                
                                <div className="space-y-3">
                                  <div>
                                    <Label htmlFor={`edit-amount-${response.id}`}>Quote Amount (₹)</Label>
                                    <Input
                                      id={`edit-amount-${response.id}`}
                                      type="number"
                                      value={editQuoteAmount}
                                      onChange={(e) => setEditQuoteAmount(e.target.value)}
                                      placeholder="Enter your quote amount"
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor={`edit-message-${response.id}`}>Message (Optional)</Label>
                                    <Textarea
                                      id={`edit-message-${response.id}`}
                                      value={editQuoteMessage}
                                      onChange={(e) => setEditQuoteMessage(e.target.value)}
                                      placeholder="Add a message to your quote..."
                                      rows={3}
                                    />
                                  </div>
                                </div>
                                
                                <div className="flex gap-2">
                                  <Button
                                    onClick={handleUpdateResponse}
                                    disabled={updateJobResponseMutation.isPending}
                                    size="sm"
                                    className="flex-1"
                                  >
                                    {updateJobResponseMutation.isPending ? (
                                      <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Updating...
                                      </>
                                    ) : (
                                      'Update Quote'
                                    )}
                                  </Button>
                                  <Button
                                    onClick={handleCancelEdit}
                                    variant="outline"
                                    size="sm"
                                    className="flex-1"
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              // View mode
                              <>
                                <div className="flex items-start justify-between mb-2">
                                  <div>
                                    <h4 className="font-semibold text-foreground">{response.job_title}</h4>
                                    <p className="text-sm text-muted-foreground">
                                      Job ID: {response.job}
                                    </p>
                                    <p className="text-sm font-medium text-accent">
                                      Quote: {response.amount_display || `₹${response.quote_amount}`}
                                    </p>
                                  </div>
                                  <Badge variant="outline">Quote Sent</Badge>
                                </div>
                                {response.message && (
                                  <div className="mt-2 mb-3">
                                    <p className="text-sm text-muted-foreground">
                                      <strong>Your message:</strong> "{response.message}"
                                    </p>
                                  </div>
                                )}
                                
                                <div className="flex gap-2 mt-3">
                                  <Button
                                    onClick={() => handleEditResponse(response)}
                                    variant="outline"
                                    size="sm"
                                    className="flex-1"
                                    disabled={updateJobResponseMutation.isPending || deleteJobResponseMutation.isPending}
                                  >
                                    <Edit className="w-4 h-4 mr-2" />
                                    Modify
                                  </Button>
                                  <Button
                                    onClick={() => handleDeleteResponse(response.id)}
                                    variant="destructive"
                                    size="sm"
                                    className="flex-1"
                                    disabled={updateJobResponseMutation.isPending || deleteJobResponseMutation.isPending}
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Cancel
                                  </Button>
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                        <p>No quotes sent yet.</p>
                        <p className="text-sm">Quotes you send will appear here.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Active Jobs Tab */}
            <TabsContent value="active" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-foreground">Active Jobs</h2>
                <Badge variant="default" className="bg-green-100 text-green-800">
                  {assignments?.filter(assignment => ['assigned', 'started'].includes(assignment.status)).length || 0} Active
                </Badge>
              </div>
              
              {assignmentsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  {assignments?.filter(assignment => ['assigned', 'started'].includes(assignment.status)).length > 0 ? (
                    assignments
                      .filter(assignment => ['assigned', 'started'].includes(assignment.status))
                      .map((assignment) => (
                        <Card key={assignment.id} className="shadow-card">
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <h3 className="text-lg font-semibold text-foreground mb-2">
                                  {assignment.job_title}
                                </h3>
                                <p className="text-muted-foreground mb-2">
                                  Assignment ID: {assignment.id}
                                </p>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <span>💰 ₹{assignment.agreed_amount}</span>
                                  <span>📅 {new Date(assignment.assigned_at).toLocaleDateString()}</span>
                                </div>
                              </div>
                              <Badge 
                                variant="default" 
                                className={assignment.status === 'started' 
                                  ? "bg-blue-100 text-blue-800" 
                                  : "bg-green-100 text-green-800"
                                }
                              >
                                {assignment.status === 'started' ? 'In Progress' : 'Assigned'}
                              </Badge>
                            </div>
                            
                            <div className="flex gap-2">
                              {assignment.status === 'assigned' && (
                                <Button 
                                  onClick={() => handleAssignmentStatusUpdate(assignment.id, 'started')}
                                  className="flex-1"
                                  variant="outline"
                                >
                                  Start Job
                                </Button>
                              )}
                              {(assignment.status === 'assigned' || assignment.status === 'started') && (
                                <Button 
                                  onClick={() => handleAssignmentStatusUpdate(assignment.id, 'completed')}
                                  className="flex-1"
                                >
                                  Mark as Completed
                                </Button>
                              )}
                              <Button variant="outline">
                                Contact Customer
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                  ) : (
                    <div className="text-center py-12">
                      <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                      <h3 className="text-lg font-semibold text-foreground mb-2">No Active Jobs</h3>
                      <p className="text-muted-foreground mb-4">
                        Jobs confirmed by customers will appear here.
                      </p>
                      <Button variant="outline" onClick={() => setActiveTab('jobs')}>
                        Browse Available Jobs
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            {/* Earnings Tab */}
            <TabsContent value="earnings" className="space-y-8">
              <div className="grid md:grid-cols-2 gap-8">
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-6 h-6 text-accent" />
                      Earnings Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {earningsLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin" />
                      </div>
                    ) : earningsError ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>Error loading earnings data</p>
                        <p className="text-sm">{earningsError}</p>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-4 bg-accent/5 rounded-lg">
                            <p className="text-sm text-muted-foreground mb-1">This Month</p>
                            <p className="text-2xl font-bold text-accent">
                              ₹{earningsSummary?.this_month_gross_earnings || '0'}
                            </p>
                          </div>
                          <div className="text-center p-4 bg-primary/5 rounded-lg">
                            <p className="text-sm text-muted-foreground mb-1">Total Earned</p>
                            <p className="text-2xl font-bold text-primary">
                              ₹{earningsSummary?.gross_total_earnings || '0'}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Average rating</span>
                            <span className="font-medium">
                              {earningsSummary?.average_rating && !isNaN(parseFloat(earningsSummary.average_rating)) ? `${parseFloat(earningsSummary.average_rating).toFixed(1)}⭐` : 'N/A'}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Jobs completed</span>
                            <span className="font-medium">{earningsSummary?.completed_jobs || 0}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Pending amount</span>
                            <span className="font-medium">₹{earningsSummary?.pending_amount || '0'}</span>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wallet className="w-6 h-6 text-energy" />
                      Wallet
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <IndianRupee className="w-8 h-8 text-energy" />
                      <Badge variant="outline" className="text-energy border-energy">
                        Available
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Available Balance</p>
                      <p className="text-3xl font-bold text-foreground">
                        ₹{earningsSummary?.total_earnings || '0'}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Pending: ₹{earningsSummary?.pending_amount || '0'}
                      </p>
                      <Button variant="outline" size="sm" className="mt-3">
                        Withdraw
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Transaction History */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Recent Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {earningsLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin" />
                      </div>
                    ) : earningsError ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>Error loading transactions</p>
                        <p className="text-sm">{earningsError}</p>
                      </div>
                    ) : transactions.length > 0 ? (
                      transactions.slice(0, 5).map((transaction) => (
                        <div key={transaction.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              transaction.transaction_type === 'payment' ? 'bg-accent/10' : 'bg-primary/10'
                            }`}>
                              {transaction.transaction_type === 'payment' ? (
                                <IndianRupee className="w-5 h-5 text-accent" />
                              ) : (
                                <Wallet className="w-5 h-5 text-primary" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{transaction.assignment_job_title}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(transaction.created_at).toLocaleDateString('en-IN', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-semibold ${
                              transaction.transaction_type === 'payment' ? 'text-accent' : 'text-muted-foreground'
                            }`}>
                              +₹{transaction.net_amount}
                            </p>
                            <Badge variant="outline" className="text-xs">
                              {transaction.status}
                            </Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Wallet className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                        <p>No transactions yet</p>
                        <p className="text-sm">Complete jobs to see your earnings here</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="space-y-6">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-6 h-6 text-primary" />
                    Job History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {assignmentsLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin" />
                      </div>
                    ) : safeAssignments.length > 0 ? (
                      safeAssignments.map((assignment) => (
                        <div key={assignment.id} className="p-4 border border-border rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-semibold text-foreground">{assignment.job_title}</h4>
                              <p className="text-sm text-muted-foreground">
                                Job ID: {assignment.job}
                              </p>
                            </div>
                            <Badge variant={
                              assignment.status === 'completed' ? 'default' :
                              assignment.status === 'assigned' ? 'secondary' :
                              assignment.status === 'started' ? 'outline' : 'destructive'
                            }>
                              {assignment.status}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                            <div>
                              <span className="font-medium">Amount:</span> ₹{assignment.agreed_amount}
                            </div>
                            <div>
                              <span className="font-medium">Date:</span> {new Date(assignment.assigned_at).toLocaleDateString()}
                            </div>
                          </div>
                          {assignment.customer_rating && (
                            <div className="mt-3 pt-3 border-t border-border">
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">Customer Rating:</span>
                                <RatingStars rating={assignment.customer_rating} size={14} />
                              </div>
                            </div>
                          )}
                          {assignment.status === 'completed' && (
                            <div className="mt-3 pt-3 border-t border-border">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenRatingDialog(assignment)}
                                className="w-full"
                              >
                                <Star className="w-4 h-4 mr-2" />
                                Rate Customer
                              </Button>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No job history available.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-8">
              {profileLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <span className="ml-2">Loading profile...</span>
                </div>
              ) : profileError ? (
                <div className="text-center py-8 text-red-500">
                  Error loading profile: {profileError.message}
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
                          <Label htmlFor="location">Address</Label>
                          <Input 
                            id="location" 
                            value={profileForm.address}
                            onChange={(e) => handleProfileFormChange('address', e.target.value)}
                            placeholder="Enter your address" 
                          />
                        </div>
                        
                        {/* Profile Stats */}
                        <div className="pt-4 border-t border-border">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Jobs Completed:</span>
                              <div className="font-semibold">{workerProfile?.total_jobs_completed || 0}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Average Rating:</span>
                              <div className="flex items-center gap-1">
                                <RatingStars rating={workerProfile?.average_rating || 0} size={14} />
                                <span className="font-semibold">({(workerProfile?.average_rating && typeof workerProfile.average_rating === 'number') ? workerProfile.average_rating.toFixed(1) : '0.0'})</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="shadow-card">
                      <CardHeader>
                        <CardTitle>Professional Details</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label>Skills</Label>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {profileForm.skills.map((skill) => (
                              <Badge 
                                key={skill} 
                                variant="secondary" 
                                className="cursor-pointer"
                                onClick={() => handleSkillRemove(skill)}
                              >
                                {skill} ×
                              </Badge>
                            ))}
                            <Badge 
                              variant="outline" 
                              className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                              onClick={() => {
                                const newSkill = prompt('Enter a new skill:');
                                if (newSkill) handleSkillAdd(newSkill);
                              }}
                            >
                              + Add Skill
                            </Badge>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="bio">About You</Label>
                          <Textarea
                            id="bio"
                            value={profileForm.bio}
                            onChange={(e) => handleProfileFormChange('bio', e.target.value)}
                            placeholder="Tell customers about your experience and expertise..."
                            className="min-h-[100px]"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="experience">Years of Experience</Label>
                          <Input 
                            id="experience" 
                            type="number" 
                            value={profileForm.experience_years}
                            onChange={(e) => handleProfileFormChange('experience_years', parseInt(e.target.value) || 0)}
                            placeholder="5" 
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="hourlyRate">Hourly Rate (₹)</Label>
                          <Input 
                            id="hourlyRate" 
                            type="number" 
                            value={profileForm.hourly_rate}
                            onChange={(e) => handleProfileFormChange('hourly_rate', parseInt(e.target.value) || 0)}
                            placeholder="500" 
                          />
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            id="availability"
                            checked={profileForm.is_available}
                            onCheckedChange={(checked) => handleProfileFormChange('is_available', checked)}
                          />
                          <Label htmlFor="availability">Available for work</Label>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="shadow-card">
                    <CardHeader>
                      <CardTitle>Documents & Verification</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <Label>Profile Photo</Label>
                          {profileForm.profile_picture ? (
                            <div className="border rounded-lg p-4 text-center">
                              <img 
                                src={profileForm.profile_picture} 
                                alt="Profile" 
                                className="w-24 h-24 rounded-full mx-auto mb-2 object-cover"
                              />
                              <Button variant="outline" size="sm">
                                Change Photo
                              </Button>
                            </div>
                          ) : (
                            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                              <p className="text-sm text-muted-foreground">Upload your photo</p>
                              <Button variant="outline" size="sm" className="mt-2">
                                Choose File
                              </Button>
                            </div>
                          )}
                        </div>

                        <div className="space-y-3">
                          <Label>ID Verification</Label>
                          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                            <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">Upload ID proof</p>
                            <Button variant="outline" size="sm" className="mt-2">
                              Choose File
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3 pt-4">
                        <Button 
                          className="flex-1" 
                          onClick={handleProfileSave}
                          disabled={updateProfileMutation.isPending}
                        >
                          {updateProfileMutation.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            'Save Changes'
                          )}
                        </Button>
                        <Button variant="outline" onClick={handleProfileCancel}>
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Quote Dialog */}
      <Dialog open={quoteDialogOpen} onOpenChange={setQuoteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Send Quote</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="quote-amount" className="text-right">
                Amount (₹)
              </Label>
              <Input
                id="quote-amount"
                type="number"
                value={quoteAmount}
                onChange={(e) => setQuoteAmount(e.target.value)}
                className="col-span-3"
                placeholder="Enter your quote amount"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="quote-message" className="text-right">
                Message
              </Label>
              <Textarea
                id="quote-message"
                value={quoteMessage}
                onChange={(e) => setQuoteMessage(e.target.value)}
                className="col-span-3"
                placeholder="Add a message (optional)"
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setQuoteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleQuoteSubmit}>
              Send Quote
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rating Dialog */}
      <Dialog open={ratingDialogOpen} onOpenChange={setRatingDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Rate Customer</DialogTitle>
            <DialogDescription>
              Provide an overall rating and optional detailed ratings for this completed assignment.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Overall Rating */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Overall Rating *</Label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-8 h-8 cursor-pointer transition-colors ${
                      star <= ratingForm.rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300 hover:text-yellow-400'
                    }`}
                    onClick={() => setRatingForm(prev => ({ ...prev, rating: star }))}
                  />
                ))}
                <span className="ml-2 text-sm text-muted-foreground">
                  {ratingForm.rating > 0 ? `${ratingForm.rating}/5` : 'Select rating'}
                </span>
              </div>
            </div>

            {/* Specific Ratings */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">Detailed Ratings</Label>
              
              {/* Quality Rating */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Quality</span>
                  <span className="text-sm text-muted-foreground">{ratingForm.quality_rating}/5</span>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 cursor-pointer transition-colors ${
                        star <= ratingForm.quality_rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300 hover:text-yellow-400'
                      }`}
                      onClick={() => setRatingForm(prev => ({ ...prev, quality_rating: star }))}
                    />
                  ))}
                </div>
              </div>

              {/* Communication Rating */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Communication</span>
                  <span className="text-sm text-muted-foreground">{ratingForm.communication_rating}/5</span>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 cursor-pointer transition-colors ${
                        star <= ratingForm.communication_rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300 hover:text-yellow-400'
                      }`}
                      onClick={() => setRatingForm(prev => ({ ...prev, communication_rating: star }))}
                    />
                  ))}
                </div>
              </div>

              {/* Punctuality Rating */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Punctuality</span>
                  <span className="text-sm text-muted-foreground">{ratingForm.punctuality_rating}/5</span>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 cursor-pointer transition-colors ${
                        star <= ratingForm.punctuality_rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300 hover:text-yellow-400'
                      }`}
                      onClick={() => setRatingForm(prev => ({ ...prev, punctuality_rating: star }))}
                    />
                  ))}
                </div>
              </div>

              {/* Professionalism Rating */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Professionalism</span>
                  <span className="text-sm text-muted-foreground">{ratingForm.professionalism_rating}/5</span>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 cursor-pointer transition-colors ${
                        star <= ratingForm.professionalism_rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300 hover:text-yellow-400'
                      }`}
                      onClick={() => setRatingForm(prev => ({ ...prev, professionalism_rating: star }))}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Review */}
            <div className="space-y-2">
              <Label htmlFor="review" className="text-sm font-medium">Review</Label>
              <Textarea
                id="review"
                placeholder="Share your experience working with this customer..."
                value={ratingForm.review}
                onChange={(e) => setRatingForm(prev => ({ ...prev, review: e.target.value }))}
                rows={4}
              />
            </div>

            {/* Anonymous Option */}
            <div className="flex items-center space-x-2">
              <Switch
                id="anonymous"
                checked={ratingForm.is_anonymous}
                onCheckedChange={(checked) => setRatingForm(prev => ({ ...prev, is_anonymous: checked }))}
              />
              <Label htmlFor="anonymous" className="text-sm">Submit anonymously</Label>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => setRatingDialogOpen(false)}
              disabled={isSubmittingRating}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitRating}
              disabled={isSubmittingRating || ratingForm.rating === 0}
            >
              {isSubmittingRating ? 'Submitting...' : 'Submit Rating'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default WorkerPortal;
