import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, CheckSquare, Clock, MapPin } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ChecklistForm } from "./ChecklistForm";
import { ChecklistExecutor } from "./ChecklistExecutor";

interface ChecklistsProps {
  userRole: string;
}

interface Checklist {
  id: string;
  name: string;
  checklist_type: string;
  store_id: string | null;
  is_active: boolean;
  created_at: string;
  checklist_items: {
    id: string;
    item_text: string;
    description: string;
    is_required: boolean;
    requires_photo: boolean;
    requires_note: boolean;
  }[];
}

export const Checklists = ({ userRole }: ChecklistsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [executingChecklist, setExecutingChecklist] = useState<Checklist | null>(null);

  const canManageChecklists = ['business_owner', 'manager', 'office'].includes(userRole);

  useEffect(() => {
    fetchChecklists();
  }, [user]);

  const fetchChecklists = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const { data: membershipData } = await supabase
        .from("user_business_memberships")
        .select("business_id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();

      if (!membershipData) return;

      const { data, error } = await supabase
        .from("checklists")
        .select(`
          *,
          checklist_items (
            id,
            item_text,
            description,
            is_required,
            requires_photo,
            requires_note
          )
        `)
        .eq("business_id", membershipData.business_id)
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setChecklists(data || []);
    } catch (error: any) {
      console.error("Error fetching checklists:", error);
      toast({
        title: "Error",
        description: "Failed to load checklists",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredChecklists = checklists.filter(checklist =>
    checklist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    checklist.checklist_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTypeColor = (type: string) => {
    switch (type) {
      case "opening": return "default";
      case "closing": return "destructive";
      case "maintenance": return "outline";
      case "custom": return "secondary";
      default: return "default";
    }
  };

  if (loading) {
    return <div>Loading checklists...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Checklists</h2>
          <p className="text-muted-foreground">
            Store opening, closing, and maintenance checklists
          </p>
        </div>
        {canManageChecklists && (
          <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Checklist
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Checklist</DialogTitle>
              </DialogHeader>
              <ChecklistForm 
                onSuccess={() => {
                  setShowNewDialog(false);
                  fetchChecklists();
                }}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search checklists..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Checklists grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredChecklists.map((checklist) => (
          <Card key={checklist.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{checklist.name}</CardTitle>
                  <Badge variant={getTypeColor(checklist.checklist_type)}>
                    {checklist.checklist_type}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckSquare className="h-4 w-4" />
                  <span>{checklist.checklist_items.length} items</span>
                </div>
                
                {checklist.store_id && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>Store specific</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Created {new Date(checklist.created_at).toLocaleDateString()}</span>
                </div>

                <div className="pt-2">
                  <Button 
                    className="w-full" 
                    onClick={() => setExecutingChecklist(checklist)}
                  >
                    Execute Checklist
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredChecklists.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <CheckSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Checklists</h3>
            <p className="text-muted-foreground">
              {canManageChecklists ? "Create checklists to get started." : "No checklists available yet."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Checklist Executor Dialog */}
      {executingChecklist && (
        <Dialog open={!!executingChecklist} onOpenChange={() => setExecutingChecklist(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Execute: {executingChecklist.name}</DialogTitle>
            </DialogHeader>
            <ChecklistExecutor 
              checklist={executingChecklist}
              onComplete={() => {
                setExecutingChecklist(null);
                fetchChecklists();
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};