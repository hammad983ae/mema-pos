import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  Sunrise, 
  TrendingUp, 
  Clock, 
  DollarSign,
  CheckCircle,
  Users
} from "lucide-react";

interface PositionTypeSelectorProps {
  currentPositionType?: string;
  onPositionSet?: () => void;
}

export const PositionTypeSelector = ({ currentPositionType, onPositionSet }: PositionTypeSelectorProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedType, setSelectedType] = useState<'opener' | 'upseller' | null>(
    currentPositionType as 'opener' | 'upseller' || null
  );
  const [specialties, setSpecialties] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleSavePosition = async () => {
    if (!user || !selectedType) return;

    try {
      setLoading(true);

      const specialtiesArray = specialties
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const { error } = await supabase
        .from("profiles")
        .update({
          position_type: selectedType,
          specialties: specialtiesArray,
          availability_preferences: {
            preferredShifts: selectedType === 'opener' ? ['morning'] : ['afternoon', 'evening'],
            flexibleSchedule: true
          },
          performance_metrics: {
            initialized: true,
            positionType: selectedType,
            setupDate: new Date().toISOString()
          }
        })
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Position Set Successfully",
        description: `You're now configured as an ${selectedType}. Your dashboard will reflect this role.`,
      });

      onPositionSet?.();
    } catch (error) {
      console.error("Error setting position type:", error);
      toast({
        title: "Error",
        description: "Failed to set position type",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const positionTypes = [
    {
      type: 'opener' as const,
      title: "Opener",
      icon: Sunrise,
      description: "Focused on opening new customers and building initial sales relationships",
      responsibilities: [
        "Initial customer contact and rapport building",
        "Product introductions and demonstrations", 
        "Qualifying customer needs and interests",
        "Creating opening sales under $1,000",
        "Building customer trust and engagement",
        "Setting foundation for future upsells"
      ],
      skills: [
        "Customer relationship building",
        "Active listening and communication",
        "Product knowledge basics",
        "Rapport building techniques",
        "Opening conversation skills"
      ],
      metrics: [
        "Number of opens per day/week",
        "Opening conversion rate",
        "Average opening value",
        "Customer engagement scores"
      ]
    },
    {
      type: 'upseller' as const,
      title: "Upseller",
      icon: TrendingUp,
      description: "Focused on maximizing sales and enhancing customer experience",
      responsibilities: [
        "Identify upselling opportunities",
        "Build customer relationships",
        "Increase average transaction value",
        "Provide expert product knowledge",
        "Close sales effectively",
        "Drive revenue growth"
      ],
      skills: [
        "Sales techniques and persuasion",
        "Product knowledge expertise",
        "Customer relationship building",
        "Communication and listening",
        "Goal-oriented mindset"
      ],
      metrics: [
        "Upsell success rate",
        "Average ticket increase",
        "Sales goal achievement",
        "Customer satisfaction scores"
      ]
    }
  ];

  if (currentPositionType && !selectedType) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Position Already Set
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Your position type is already configured as <Badge variant="outline">{currentPositionType}</Badge>.
            You can view your role-specific dashboard in the Schedule tab.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center relative">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => window.history.back()}
          className="absolute left-0 top-0"
        >
          ← Back
        </Button>
        <h2 className="text-2xl font-bold mb-2">Choose Your Position Type</h2>
        <p className="text-muted-foreground">
          Select your primary role to unlock personalized dashboards and AI-powered scheduling insights.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {positionTypes.map((position) => {
          const Icon = position.icon;
          const isSelected = selectedType === position.type;

          return (
            <Card 
              key={position.type}
              className={`cursor-pointer transition-all ${
                isSelected 
                  ? 'ring-2 ring-primary border-primary bg-primary/5' 
                  : 'hover:shadow-lg border-border'
              }`}
              onClick={() => setSelectedType(position.type)}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    position.type === 'opener' ? 'bg-blue-100' : 'bg-green-100'
                  }`}>
                    <Icon className={`h-6 w-6 ${
                      position.type === 'opener' ? 'text-blue-600' : 'text-green-600'
                    }`} />
                  </div>
                  {position.title}
                  {isSelected && <CheckCircle className="h-5 w-5 text-primary ml-auto" />}
                </CardTitle>
                <p className="text-sm text-muted-foreground">{position.description}</p>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Key Responsibilities
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {position.responsibilities.slice(0, 4).map((resp, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                        {resp}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Success Metrics
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {position.metrics.map((metric, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {metric}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedType && (
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="specialties">Your Specialties (comma-separated)</Label>
              <Input
                id="specialties"
                placeholder="e.g. Customer service, Product knowledge, Team leadership"
                value={specialties}
                onChange={(e) => setSpecialties(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Help us understand your strengths for better team pairing recommendations
              </p>
            </div>

            <Button 
              onClick={handleSavePosition}
              disabled={loading}
              className="w-full"
            >
              {loading ? "Setting Position..." : `Set as ${selectedType === 'opener' ? 'Opener' : 'Upseller'}`}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};