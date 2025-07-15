import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Camera, FileText, CheckSquare, Clock, AlertCircle } from "lucide-react";

interface ChecklistExecutorProps {
  checklist: {
    id: string;
    name: string;
    checklist_type: string;
    checklist_items: {
      id: string;
      item_text: string;
      description: string;
      is_required: boolean;
      requires_photo: boolean;
      requires_note: boolean;
    }[];
  };
  onComplete: () => void;
}

interface ItemCompletion {
  item_id: string;
  completed: boolean;
  notes: string;
  photo_url: string;
}

export const ChecklistExecutor = ({ checklist, onComplete }: ChecklistExecutorProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [startTime] = useState(new Date());
  
  const [completions, setCompletions] = useState<ItemCompletion[]>(
    checklist.checklist_items.map(item => ({
      item_id: item.id,
      completed: false,
      notes: "",
      photo_url: ""
    }))
  );

  const updateCompletion = (itemId: string, field: keyof ItemCompletion, value: any) => {
    setCompletions(prev => prev.map(completion =>
      completion.item_id === itemId
        ? { ...completion, [field]: value }
        : completion
    ));
  };

  const handleComplete = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const { data: membershipData } = await supabase
        .from("user_business_memberships")
        .select("business_id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();

      if (!membershipData) throw new Error("Business context not found");

      const endTime = new Date();
      const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));

      // Create completion records for all items
      const completionRecords = completions.map(completion => {
        const item = checklist.checklist_items.find(i => i.id === completion.item_id);
        return {
          checklist_id: checklist.id,
          checklist_item_id: completion.item_id,
          completed_by: user.id,
          business_id: membershipData.business_id,
          notes: completion.notes || null,
          photo_url: completion.photo_url || null,
          duration_minutes: durationMinutes
        };
      });

      const { error } = await supabase
        .from("task_completions")
        .insert(completionRecords);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Checklist "${checklist.name}" completed successfully`,
      });

      onComplete();
    } catch (error: any) {
      console.error("Error completing checklist:", error);
      toast({
        title: "Error",
        description: "Failed to complete checklist",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const completedCount = completions.filter(c => c.completed).length;
  const totalCount = checklist.checklist_items.length;
  const requiredItems = checklist.checklist_items.filter(item => item.is_required);
  const completedRequiredCount = completions.filter(c => {
    const item = checklist.checklist_items.find(i => i.id === c.item_id);
    return c.completed && item?.is_required;
  }).length;

  const canComplete = completedRequiredCount === requiredItems.length;

  return (
    <div className="space-y-6">
      {/* Progress header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5" />
            <span className="text-lg font-semibold">{checklist.name}</span>
          </div>
          <Badge variant={checklist.checklist_type === 'opening' ? 'default' : 
                        checklist.checklist_type === 'closing' ? 'destructive' : 'secondary'}>
            {checklist.checklist_type}
          </Badge>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            Started: {startTime.toLocaleTimeString()}
          </div>
          <div>
            Progress: {completedCount}/{totalCount} items
          </div>
          {requiredItems.length > 0 && (
            <div className="flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              Required: {completedRequiredCount}/{requiredItems.length}
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-primary h-2 rounded-full transition-all"
          style={{ width: `${(completedCount / totalCount) * 100}%` }}
        />
      </div>

      {/* Checklist items */}
      <div className="space-y-4">
        {checklist.checklist_items.map((item, index) => {
          const completion = completions.find(c => c.item_id === item.id);
          if (!completion) return null;

          return (
            <Card key={item.id} className={completion.completed ? "border-green-500" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={completion.completed}
                    onCheckedChange={(checked) => 
                      updateCompletion(item.id, 'completed', checked)
                    }
                    className="mt-1"
                  />
                  <div className="flex-1 space-y-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      {item.item_text}
                      {item.is_required && (
                        <Badge variant="destructive">Required</Badge>
                      )}
                    </CardTitle>
                    {item.description && (
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>
              </CardHeader>

              {(item.requires_note || item.requires_photo) && (
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {item.requires_note && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <FileText className="h-4 w-4" />
                          Notes
                        </div>
                        <Textarea
                          placeholder="Add notes for this item..."
                          value={completion.notes}
                          onChange={(e) => updateCompletion(item.id, 'notes', e.target.value)}
                          rows={2}
                        />
                      </div>
                    )}

                    {item.requires_photo && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Camera className="h-4 w-4" />
                          Photo Required
                        </div>
                        <div className="p-4 border-2 border-dashed rounded-lg text-center text-sm text-muted-foreground">
                          Photo upload functionality would be implemented here
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Action buttons */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button 
          onClick={handleComplete}
          disabled={loading || !canComplete}
          className="min-w-[120px]"
        >
          {loading ? "Completing..." : "Complete Checklist"}
        </Button>
      </div>

      {!canComplete && requiredItems.length > 0 && (
        <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
          <AlertCircle className="h-4 w-4 inline mr-2" />
          Please complete all required items before finishing the checklist.
        </div>
      )}
    </div>
  );
};