import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { handleAPIRequest } from "../lib/api";
import type { Review } from "../types";

interface ReviewsProps {
  roomId: string;
  roomRating?: {
    average: number;
    count: number;
    distribution: { 1: number; 2: number; 3: number; 4: number; 5: number };
  };
}

export default function Reviews({ roomId, roomRating }: ReviewsProps) {
  const { user, isAuthenticated } = useAuth();
  const { showSuccess, showError } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [userReview, setUserReview] = useState<Review | null>(null);
  
  // Review form state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');

  useEffect(() => {
    loadReviews();
  }, [roomId]);

  const loadReviews = async () => {
    try {
      const { data } = await handleAPIRequest(() => 
        fetch(`http://localhost:5000/api/reviews/room/${roomId}`).then(res => res.json())
      );
      if (data?.reviews) {
        setReviews(data.reviews);
        // Check if current user has already reviewed
        if (isAuthenticated && user) {
          const existingReview = data.reviews.find((r: Review) => 
            r.user?.id === user.id
          );
          if (existingReview) {
            setUserReview(existingReview);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const reviewData: any = {
      roomId,
      rating,
      comment: comment.trim() || undefined
    };

    // Add guest info for unauthenticated users
    if (!isAuthenticated) {
      if (!guestName.trim() || !guestEmail.trim()) {
        showError('Validation Error', 'Please provide your name and email for the review');
        return;
      }
      reviewData.guestName = guestName.trim();
      reviewData.guestEmail = guestEmail.trim();
    }

    try {
      const { data, error } = await handleAPIRequest(() => 
        fetch('http://localhost:5000/api/reviews', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(isAuthenticated && { 'Authorization': `Bearer ${localStorage.getItem('token')}` })
          },
          body: JSON.stringify(reviewData)
        }).then(res => res.json())
      );

      if (data?.review) {
        setReviews([data.review, ...reviews]);
        setShowReviewForm(false);
        resetForm();
        showSuccess('Review Submitted', 'Your review has been posted successfully!');
      } else if (error) {
        const errorMessage = typeof error === 'string' ? error : (error as any).message || 'Failed to submit review';
        showError('Review Failed', errorMessage);
      }
    } catch (error) {
      console.error('Submit review error:', error);
      showError('Review Failed', 'Failed to submit review. Please try again.');
    }
  };

  const resetForm = () => {
    setRating(5);
    setComment('');
    setGuestName('');
    setGuestEmail('');
  };

  const renderStars = (rating: number, interactive = false, onRate?: (rating: number) => void) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-5 h-5 ${interactive ? 'cursor-pointer' : ''} ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
            onClick={interactive && onRate ? () => onRate(star) : undefined}
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  const renderRatingDistribution = () => {
    return (
      <div className="space-y-2">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = roomRating?.distribution?.[star as keyof typeof roomRating.distribution] || 0;
          const percentage = roomRating?.count > 0 ? (count / roomRating.count) * 100 : 0;
          return (
            <div key={star} className="flex items-center gap-2">
              <span className="text-sm text-gray-600 w-8">{star}★</span>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-sm text-gray-600 w-8 text-right">{count}</span>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900">Guest Reviews</h3>
        {!userReview && (
          <button
            onClick={() => setShowReviewForm(!showReviewForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Write a Review
          </button>
        )}
      </div>

      {/* Rating Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="text-center">
          <div className="text-4xl font-bold text-gray-900">{roomRating?.average?.toFixed(1) || '0.0'}</div>
          {renderStars(Math.round(roomRating?.average || 0))}
          <div className="text-sm text-gray-600 mt-1">{roomRating?.count || 0} reviews</div>
        </div>
        <div>
          {renderRatingDistribution()}
        </div>
      </div>

      {/* Review Form */}
      {showReviewForm && (
        <div className="border-t pt-6 mb-6">
          <h4 className="text-lg font-medium mb-4">
            {isAuthenticated ? 'Write Your Review' : 'Write a Guest Review'}
          </h4>
          <form onSubmit={handleSubmitReview} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rating *
              </label>
              {renderStars(rating, true, setRating)}
            </div>

            {!isAuthenticated && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comment {isAuthenticated ? '(optional)' : '(optional for guests)'}
              </label>
              <textarea
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience with this room..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Submit Review
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowReviewForm(false);
                  resetForm();
                }}
                className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* User's Existing Review */}
      {userReview && (
        <div className="border-t pt-6 mb-6">
          <h4 className="text-lg font-medium mb-4">Your Review</h4>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {renderStars(userReview.rating)}
                <span className="text-sm text-gray-600">
                  {new Date(userReview.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            {userReview.comment && (
              <p className="text-gray-700">{userReview.comment}</p>
            )}
          </div>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No reviews yet. Be the first to review this room!
          </div>
        ) : (
          reviews.map((review, index) => (
            <div key={review.id || `review-${index}`} className="border-b pb-4 last:border-b-0">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="font-medium text-gray-900">
                    {review.isRegisteredUser 
                      ? review.user?.name 
                      : review.guestName
                    }
                  </div>
                  <div className="flex items-center gap-2">
                    {renderStars(review.rating)}
                    <span className="text-sm text-gray-600">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              {review.comment && (
                <p className="text-gray-700 mt-2">{review.comment}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
