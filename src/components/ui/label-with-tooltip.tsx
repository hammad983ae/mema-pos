import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

interface LabelWithTooltipProps {
  htmlFor: string;
  children: React.ReactNode;
  tooltip: string;
  required?: boolean;
}

export const LabelWithTooltip = ({ htmlFor, children, tooltip, required }: LabelWithTooltipProps) => {
  return (
    <Label htmlFor={htmlFor} className="flex items-center gap-1">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1 cursor-help">
              <span>{children}{required && " *"}</span>
              <HelpCircle className="h-3 w-3 text-muted-foreground" />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </Label>
  );
};