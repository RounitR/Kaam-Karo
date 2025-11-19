import React, { useEffect, useState } from 'react';
import { Star, TrendingUp, Users, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { useRatings, RatingSummary } from '../hooks/useRatings';
import RatingStars from './RatingStars';

interface UserRatingSummaryProps {
  userId: number;
  userType?: 'customer' | 'worker';
  showRecentRatings?: boolean;
}

export const UserRatingSummary: React.FC<UserRatingSummaryProps> = ({
  userId,
  userType = 'worker',
  showRecentRatings = true,
}) => {
  const { fetchUserRatingSummary, loading, error } = useRatings();
  const [summary, setSummary] = useState<RatingSummary | null>(null);

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const data = await fetchUserRatingSummary(userId);
        setSummary(data);
      } catch (err) {
        console.error('Failed to load rating summary:', err);
      }
    };

    if (userId) {
      loadSummary();
    }
  }, [userId, fetchUserRatingSummary]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 rounded"></div>
              <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !summary) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">
            {error || 'Unable to load rating summary'}
          </p>
        </CardContent>
      </Card>
    );
  }

  const getRatingLevel = (rating: number) => {
    if (rating >= 4.5) return { label: 'Excellent', color: 'bg-green-500' };
    if (rating >= 4.0) return { label: 'Very Good', color: 'bg-blue-500' };
    if (rating >= 3.5) return { label: 'Good', color: 'bg-yellow-500' };
    if (rating >= 3.0) return { label: 'Fair', color: 'bg-orange-500' };
    return { label: 'Needs Improvement', color: 'bg-red-500' };
  };

  const ratingLevel = getRatingLevel(summary.average_rating);

  return (
    <div className="space-y-6">
      {/* Overall Rating Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Award className="w-5 h-5" />
            <span>Rating Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Main Rating Display */}
            <div className="text-center">
              <div className="flex items-center justify-center space-x-4 mb-2">
                <span className="text-4xl font-bold">{(summary.average_rating && typeof summary.average_rating === 'number') ? summary.average_rating.toFixed(1) : '0.0'}</span>
                <div className="flex flex-col items-start">
                  <RatingStars 
                    rating={summary.average_rating} 
                    maxRating={5} 
                    size={20} 
                    showNumber={false} 
                  />
                  <Badge variant="secondary" className={`mt-1 ${ratingLevel.color} text-white`}>
                    {ratingLevel.label}
                  </Badge>
                </div>
              </div>
              <p className="text-muted-foreground">
                Based on {summary.total_ratings} {summary.total_ratings === 1 ? 'review' : 'reviews'}
              </p>
            </div>

            {/* Rating Distribution */}
            {Object.keys(summary.rating_distribution).length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium">Rating Distribution</h4>
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = summary.rating_distribution[star.toString()] || 0;
                  const percentage = summary.total_ratings > 0 ? (count / summary.total_ratings) * 100 : 0;
                  
                  return (
                    <div key={star} className="flex items-center space-x-3">
                      <div className="flex items-center space-x-1 w-12">
                        <span className="text-sm">{star}</span>
                        <Star className="w-3 h-3 fill-current text-yellow-400" />
                      </div>
                      <Progress value={percentage} className="flex-1" />
                      <span className="text-sm text-muted-foreground w-8">{count}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-2xl font-semibold">{summary.total_ratings}</span>
                </div>
                <p className="text-sm text-muted-foreground">Total Reviews</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                  <span className="text-2xl font-semibold">
                    {summary.average_rating && typeof summary.average_rating === 'number' && summary.average_rating > 0 ? `${((summary.average_rating / 5) * 100).toFixed(0)}%` : '0%'}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">Satisfaction</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Ratings */}
      {showRecentRatings && summary.recent_ratings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {summary.recent_ratings.slice(0, 3).map((rating) => (
                <div key={rating.id} className="border-b last:border-b-0 pb-4 last:pb-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium">{rating.rater_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {rating.assignment_job_title}
                      </p>
                    </div>
                    <div className="text-right">
                      <RatingStars 
                        rating={rating.rating} 
                        maxRating={5} 
                        size={14} 
                        showNumber 
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(rating.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {rating.review && (
                    <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
                      "{rating.review}"
                    </p>
                  )}
                  {rating.helpful_count > 0 && (
                    <div className="flex items-center space-x-1 mt-2">
                      <span className="text-xs text-muted-foreground">
                        {rating.helpful_count} found this helpful
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Ratings State */}
      {summary.total_ratings === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Star className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">No ratings yet</h3>
            <p className="text-muted-foreground">
              {userType === 'worker' 
                ? 'Complete some jobs to start receiving ratings from customers.'
                : 'Rate some workers to build your reputation as a customer.'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UserRatingSummary;