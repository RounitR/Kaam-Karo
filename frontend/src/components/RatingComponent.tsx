import React, { useState } from 'react';
import { ThumbsUp, Edit, Trash2, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import { useToast } from './ui/use-toast';
import { useRatings, Rating, CreateRatingData } from '../hooks/useRatings';
import RatingStars from './RatingStars';

interface RatingComponentProps {
  ratings?: Rating[];
  userId?: number;
  assignmentId?: number;
  rateeId?: number;
  canCreateRating?: boolean;
  ratingType?: 'customer_to_worker' | 'worker_to_customer';
  onRatingCreated?: (rating: Rating) => void;
  onRatingUpdated?: (rating: Rating) => void;
  onRatingDeleted?: (ratingId: number) => void;
}

export const RatingComponent: React.FC<RatingComponentProps> = ({
  ratings = [],
  userId,
  assignmentId,
  rateeId,
  canCreateRating = false,
  ratingType = 'customer_to_worker',
  onRatingCreated,
  onRatingUpdated,
  onRatingDeleted,
}) => {
  const { toast } = useToast();
  const {
    createRating,
    updateRating,
    deleteRating,
    markRatingHelpful,
    removeRatingHelpful,
    loading,
    error,
  } = useRatings();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingRating, setEditingRating] = useState<Rating | null>(null);
  const [formData, setFormData] = useState<CreateRatingData>({
    assignment: assignmentId || 0,
    ratee: rateeId || 0,
    rating_type: ratingType,
    rating: 5,
    review: '',
    quality_rating: 5,
    communication_rating: 5,
    punctuality_rating: 5,
    professionalism_rating: 5,
    is_anonymous: false,
  });

  const resetForm = () => {
    setFormData({
      assignment: assignmentId || 0,
      ratee: rateeId || 0,
      rating_type: ratingType,
      rating: 5,
      review: '',
      quality_rating: 5,
      communication_rating: 5,
      punctuality_rating: 5,
      professionalism_rating: 5,
      is_anonymous: false,
    });
  };

  const handleCreateRating = async () => {
    try {
      const newRating = await createRating(formData);
      toast({
        title: 'Success',
        description: 'Rating created successfully!',
      });
      setIsCreateDialogOpen(false);
      resetForm();
      onRatingCreated?.(newRating);
    } catch (err) {
      toast({
        title: 'Error',
        description: error || 'Failed to create rating',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateRating = async () => {
    if (!editingRating) return;
    
    try {
      const updatedRating = await updateRating(editingRating.id, formData);
      toast({
        title: 'Success',
        description: 'Rating updated successfully!',
      });
      setEditingRating(null);
      resetForm();
      onRatingUpdated?.(updatedRating);
    } catch (err) {
      toast({
        title: 'Error',
        description: error || 'Failed to update rating',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteRating = async (ratingId: number) => {
    try {
      await deleteRating(ratingId);
      toast({
        title: 'Success',
        description: 'Rating deleted successfully!',
      });
      onRatingDeleted?.(ratingId);
    } catch (err) {
      toast({
        title: 'Error',
        description: error || 'Failed to delete rating',
        variant: 'destructive',
      });
    }
  };

  const handleHelpfulVote = async (rating: Rating) => {
    try {
      await markRatingHelpful(rating.id);
      toast({
        title: 'Success',
        description: 'Marked as helpful',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: error || 'Failed to update helpful vote',
        variant: 'destructive',
      });
    }
  };

  const startEdit = (rating: Rating) => {
    setEditingRating(rating);
    setFormData({
      assignment: rating.assignment,
      ratee: rating.ratee,
      rating_type: rating.rating_type,
      rating: rating.rating,
      review: rating.review,
      quality_rating: rating.quality_rating,
      communication_rating: rating.communication_rating,
      punctuality_rating: rating.punctuality_rating,
      professionalism_rating: rating.professionalism_rating,
      is_anonymous: rating.is_anonymous,
    });
  };

  const RatingForm = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="rating">Overall Rating</Label>
        <div className="flex items-center space-x-4 mt-2">
          <Slider
            value={[formData.rating]}
            onValueChange={(value) => setFormData({ ...formData, rating: value[0] })}
            max={5}
            min={1}
            step={1}
            className="flex-1"
          />
          <span className="text-sm font-medium w-8">{formData.rating}</span>
        </div>
      </div>

      <div>
        <Label htmlFor="quality_rating">Quality Rating</Label>
        <div className="flex items-center space-x-4 mt-2">
          <Slider
            value={[formData.quality_rating]}
            onValueChange={(value) => setFormData({ ...formData, quality_rating: value[0] })}
            max={5}
            min={1}
            step={1}
            className="flex-1"
          />
          <span className="text-sm font-medium w-8">{formData.quality_rating}</span>
        </div>
      </div>

      <div>
        <Label htmlFor="communication_rating">Communication Rating</Label>
        <div className="flex items-center space-x-4 mt-2">
          <Slider
            value={[formData.communication_rating]}
            onValueChange={(value) => setFormData({ ...formData, communication_rating: value[0] })}
            max={5}
            min={1}
            step={1}
            className="flex-1"
          />
          <span className="text-sm font-medium w-8">{formData.communication_rating}</span>
        </div>
      </div>

      <div>
        <Label htmlFor="punctuality_rating">Punctuality Rating</Label>
        <div className="flex items-center space-x-4 mt-2">
          <Slider
            value={[formData.punctuality_rating]}
            onValueChange={(value) => setFormData({ ...formData, punctuality_rating: value[0] })}
            max={5}
            min={1}
            step={1}
            className="flex-1"
          />
          <span className="text-sm font-medium w-8">{formData.punctuality_rating}</span>
        </div>
      </div>

      <div>
        <Label htmlFor="professionalism_rating">Professionalism Rating</Label>
        <div className="flex items-center space-x-4 mt-2">
          <Slider
            value={[formData.professionalism_rating]}
            onValueChange={(value) => setFormData({ ...formData, professionalism_rating: value[0] })}
            max={5}
            min={1}
            step={1}
            className="flex-1"
          />
          <span className="text-sm font-medium w-8">{formData.professionalism_rating}</span>
        </div>
      </div>

      <div>
        <Label htmlFor="review">Review (Optional)</Label>
        <Textarea
          id="review"
          placeholder="Share your experience..."
          value={formData.review}
          onChange={(e) => setFormData({ ...formData, review: e.target.value })}
          className="mt-2"
          rows={4}
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button
          variant="outline"
          onClick={() => {
            setIsCreateDialogOpen(false);
            setEditingRating(null);
            resetForm();
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={editingRating ? handleUpdateRating : handleCreateRating}
          disabled={loading}
        >
          {loading ? 'Saving...' : editingRating ? 'Update Rating' : 'Create Rating'}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {canCreateRating && (
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">
              <MessageSquare className="w-4 h-4 mr-2" />
              Leave a Rating
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Rating</DialogTitle>
            </DialogHeader>
            <RatingForm />
          </DialogContent>
        </Dialog>
      )}

      {editingRating && (
        <Dialog open={!!editingRating} onOpenChange={() => setEditingRating(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Rating</DialogTitle>
            </DialogHeader>
            <RatingForm />
          </DialogContent>
        </Dialog>
      )}

      <div className="space-y-4">
        {ratings.map((rating) => (
          <Card key={rating.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div>
                    <p className="font-medium">{rating.rater_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {rating.assignment_job_title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(rating.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={rating.rating_type === 'customer_to_worker' ? 'default' : 'secondary'}>
                    {rating.rating_type === 'customer_to_worker' ? 'Customer Review' : 'Worker Review'}
                  </Badge>
                  {rating.can_rate && (
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEdit(rating)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteRating(rating.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">Overall:</span>
                    <RatingStars rating={rating.rating} maxRating={5} size={16} showNumber />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Quality:</span>
                    <RatingStars rating={rating.quality_rating} maxRating={5} size={12} showNumber />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Communication:</span>
                    <RatingStars rating={rating.communication_rating} maxRating={5} size={12} showNumber />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Punctuality:</span>
                    <RatingStars rating={rating.punctuality_rating} maxRating={5} size={12} showNumber />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Professionalism:</span>
                    <RatingStars rating={rating.professionalism_rating} maxRating={5} size={12} showNumber />
                  </div>
                </div>

                {rating.review && (
                  <div className="bg-muted p-3 rounded-md">
                    <p className="text-sm">{rating.review}</p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleHelpfulVote(rating)}
                  >
                    <ThumbsUp className="w-4 h-4 mr-1" />
                    Helpful ({rating.helpful_count})
                  </Button>
                  {rating.updated_at !== rating.created_at && (
                    <span className="text-xs text-muted-foreground">
                      Edited {new Date(rating.updated_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {ratings.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No ratings yet</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RatingComponent;