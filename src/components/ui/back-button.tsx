import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface BackButtonProps {
  to?: string;
  label?: string;
  className?: string;
}

export const BackButton = ({ to, label = "Back", className = "" }: BackButtonProps) => {
  const navigate = useNavigate();

  const handleBack = () => {
    console.log("BackButton clicked", { to, navigate });
    if (to) {
      console.log("Navigating to specific route:", to);
      navigate(to);
    } else {
      console.log("Navigating back one page");
      navigate(-1); // Go back to previous page
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleBack}
      className={`flex items-center gap-2 text-muted-foreground hover:text-foreground ${className}`}
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Button>
  );
};