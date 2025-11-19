import { MapPin, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import RatingStars from "./RatingStars";

interface WorkerCardProps {
  name: string;
  skills: string[];
  location: string;
  rating: number;
  completedJobs: number;
  verified: boolean;
  avatar?: string;
  distance?: string;
}

const WorkerCard = ({
  name,
  skills,
  location,
  rating,
  completedJobs,
  verified,
  avatar,
  distance,
}: WorkerCardProps) => {
  return (
    <Card className="shadow-card hover:shadow-hover transition-all duration-300 cursor-pointer">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-gradient-hero flex items-center justify-center text-primary-foreground text-xl font-semibold">
              {avatar ? (
                <img src={avatar} alt={name} className="w-full h-full rounded-full object-cover" />
              ) : (
                name.charAt(0).toUpperCase()
              )}
            </div>
            {verified && (
              <div className="absolute -bottom-1 -right-1 bg-accent rounded-full p-1">
                <CheckCircle2 className="w-4 h-4 text-accent-foreground" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  {name}
                  {verified && (
                    <span className="text-xs text-accent">Verified</span>
                  )}
                </h3>
                <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                  <MapPin className="w-3 h-3" />
                  <span>{location}</span>
                  {distance && <span className="text-xs">({distance})</span>}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-1 mb-3">
              {skills.slice(0, 3).map((skill) => (
                <Badge key={skill} variant="outline" className="text-xs">
                  {skill}
                </Badge>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <RatingStars rating={rating} size={14} />
              <span className="text-xs text-muted-foreground">
                {completedJobs} jobs completed
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WorkerCard;
