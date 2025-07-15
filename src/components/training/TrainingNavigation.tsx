import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface TrainingNavigationProps {
  onBack: () => void;
  title: string;
}

export const TrainingNavigation = ({ onBack, title }: TrainingNavigationProps) => {
  return (
    <div className="flex items-center gap-4 mb-6">
      <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back to Training
      </Button>
      <h1 className="text-2xl font-bold text-foreground">{title}</h1>
    </div>
  );
};