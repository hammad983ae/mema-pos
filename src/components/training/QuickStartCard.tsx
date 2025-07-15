import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, MessageSquare, Target } from "lucide-react";

interface QuickStartCardProps {
  modules: any[];
  userProgress: any[];
  onStartTraining: (module: any) => void;
  onResistanceTraining: () => void;
}

export const QuickStartCard = ({ 
  modules, 
  userProgress, 
  onStartTraining, 
  onResistanceTraining 
}: QuickStartCardProps) => {
  const getModuleProgress = (moduleId: string) => {
    return userProgress.find(p => p.module_id === moduleId);
  };

  const findFirstIncomplete = () => {
    return modules.find(m => {
      const progress = getModuleProgress(m.id);
      return !progress || progress.completion_percentage < 100;
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Play className="h-5 w-5 mr-2" />
          Quick Start
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={() => {
              const firstIncomplete = findFirstIncomplete();
              if (firstIncomplete) onStartTraining(firstIncomplete);
            }}
            disabled={modules.length === 0}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Continue Training
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={onResistanceTraining}
          >
            <Target className="h-4 w-4 mr-2" />
            Resistance Handling Training
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};