import { MapPin, Clock, IndianRupee } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface JobCardProps {
  title: string;
  location: string;
  timePosted: string;
  budget: string;
  category: string;
  description: string;
  urgent?: boolean;
}

const JobCard = ({
  title,
  location,
  timePosted,
  budget,
  category,
  description,
  urgent = false,
}: JobCardProps) => {
  return (
    <Card className="shadow-card hover:shadow-hover transition-all duration-300 cursor-pointer">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-foreground mb-2">{title}</h3>
            <Badge variant="secondary" className="mb-3">
              {category}
            </Badge>
          </div>
          {urgent && (
            <Badge className="bg-energy text-energy-foreground">Urgent</Badge>
          )}
        </div>

        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{description}</p>

        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            <span>{location}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{timePosted}</span>
          </div>
          <div className="flex items-center gap-1 text-accent font-semibold">
            <IndianRupee className="w-4 h-4" />
            <span>{budget}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default JobCard;
