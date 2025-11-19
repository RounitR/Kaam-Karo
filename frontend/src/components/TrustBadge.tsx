import { LucideIcon } from "lucide-react";

interface TrustBadgeProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

const TrustBadge = ({ icon: Icon, title, description }: TrustBadgeProps) => {
  return (
    <div className="flex flex-col items-center text-center p-6 rounded-xl bg-gradient-card border border-border shadow-card hover:shadow-hover transition-all duration-300">
      <div className="w-16 h-16 rounded-full bg-gradient-hero flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-primary-foreground" />
      </div>
      <h3 className="font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
};

export default TrustBadge;
