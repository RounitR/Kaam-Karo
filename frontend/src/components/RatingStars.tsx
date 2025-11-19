import { Star } from "lucide-react";

interface RatingStarsProps {
  rating: number | string;
  maxRating?: number;
  size?: number;
  showNumber?: boolean;
  className?: string;
}

const RatingStars = ({ rating, maxRating = 5, size = 16, showNumber = true, className = "" }: RatingStarsProps) => {
  // Coerce rating to a safe numeric value
  const numericRatingRaw = typeof rating === 'number' ? rating : parseFloat(String(rating));
  const numericRating = Number.isFinite(numericRatingRaw) ? numericRatingRaw : 0;

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {Array.from({ length: maxRating }).map((_, index) => (
        <Star
          key={index}
          size={size}
          className={
            index < Math.floor(numericRating)
              ? "fill-energy text-energy"
              : index < numericRating
              ? "fill-energy/50 text-energy"
              : "fill-muted text-muted"
          }
        />
      ))}
      {showNumber && (
        <span className="text-sm font-medium text-foreground ml-1">
          {numericRating.toFixed(1)}
        </span>
      )}
    </div>
  );
};

export default RatingStars;
