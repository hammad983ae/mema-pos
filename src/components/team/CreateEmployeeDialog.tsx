import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UserPlus, Mail, User, KeyRound, Loader2, Copy, Send } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CreateEmployeeDialogProps {
  businessId: string;
  onEmployeeCreated: () => void;
  trigger?: React.ReactNode;
}

const CreateEmployeeDialog = ({ businessId, onEmployeeCreated, trigger }: CreateEmployeeDialogProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'invitation'>('form');
  const [invitationLink, setInvitationLink] = useState("");
  
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    username: "",
    role: "employee",
    position: "",
    notes: "",
    temporaryPin: ""
  });
  
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }
    
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }
    
    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    } else if (formData.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    } else if (!/^[a-zA-Z0-9_]{3,20}$/.test(formData.username)) {
      newErrors.username = "Username can only contain letters, numbers, and underscores";
    }
    
    if (!formData.temporaryPin.trim()) {
      newErrors.temporaryPin = "Temporary PIN is required";
    } else if (!/^\d{4,8}$/.test(formData.temporaryPin)) {
      newErrors.temporaryPin = "PIN must be 4-8 digits";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateRandomPin = () => {
    const pin = Math.floor(Math.random() * 9000 + 1000).toString(); // 4-digit PIN
    setFormData(prev => ({ ...prev, temporaryPin: pin }));
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      // Create employee invitation
      const { data, error } = await supabase.functions.invoke('create-employee-invitation', {
        body: {
          businessId,
          email: formData.email,
          fullName: formData.fullName,
          role: formData.role
        }
      });

      if (error || !data?.success) {
        throw new Error(data?.error || 'Failed to create employee invitation');
      }

      setInvitationLink(data.invitationLink);
      setStep('invitation');
      
      toast({
        title: "Employee invitation created!",
        description: `${formData.fullName} has been invited to join your team.`,
      });

      onEmployeeCreated();
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create employee invitation",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyInvitationLink = () => {
    navigator.clipboard.writeText(invitationLink);
    toast({
      title: "Link copied!",
      description: "Invitation link has been copied to clipboard.",
    });
  };

  const sendInvitationEmail = async () => {
    try {
      // Send invitation email
      const { error } = await supabase.functions.invoke('send-employee-invitation', {
        body: {
          email: formData.email,
          fullName: formData.fullName,
          invitationLink
        }
      });

      if (error) {
        throw new Error('Failed to send invitation email');
      }

      toast({
        title: "Invitation sent!",
        description: `Invitation email has been sent to ${formData.email}.`,
      });
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send invitation email",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      fullName: "",
      email: "",
      username: "",
      role: "employee",
      position: "",
      notes: "",
      temporaryPin: ""
    });
    setErrors({});
    setStep('form');
    setInvitationLink("");
  };

  const handleClose = () => {
    setOpen(false);
    setTimeout(resetForm, 200); // Reset after dialog closes
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Employee
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === 'form' ? 'Create Employee Account' : 'Employee Invitation Created'}
          </DialogTitle>
          <DialogDescription>
            {step === 'form' 
              ? 'Create a new employee account with a temporary PIN they can change on their first login.'
              : 'Share this invitation link with the new employee.'
            }
          </DialogDescription>
        </DialogHeader>

        {step === 'form' ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    placeholder="Enter employee's full name"
                    className="pl-10"
                    value={formData.fullName}
                    onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  />
                </div>
                {errors.fullName && (
                  <p className="text-sm text-destructive">{errors.fullName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter email address"
                    className="pl-10"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="username"
                    placeholder="Create a unique username"
                    className="pl-10"
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value.toLowerCase() }))}
                  />
                </div>
                {errors.username && (
                  <p className="text-sm text-destructive">{errors.username}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">Employee</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="office">Office Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                <Input
                  id="position"
                  placeholder="e.g., Sales Associate, Technician"
                  value={formData.position}
                  onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="temporaryPin">Temporary PIN (4-8 digits)</Label>
                <div className="flex space-x-2">
                  <div className="relative flex-1">
                    <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="temporaryPin"
                      placeholder="Enter temporary PIN"
                      className="pl-10"
                      value={formData.temporaryPin}
                      onChange={(e) => setFormData(prev => ({ ...prev, temporaryPin: e.target.value.replace(/\D/g, '') }))}
                      maxLength={8}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={generateRandomPin}
                    size="sm"
                  >
                    Generate
                  </Button>
                </div>
                {errors.temporaryPin && (
                  <p className="text-sm text-destructive">{errors.temporaryPin}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Employee can change this PIN after their first login
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional notes about this employee"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                />
              </div>
            </div>

            <div className="flex space-x-2 pt-4">
              <Button onClick={handleSubmit} disabled={loading} className="flex-1">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Employee Account'
                )}
              </Button>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Alert>
              <Mail className="h-4 w-4" />
              <AlertDescription>
                The employee account has been created with temporary login credentials. 
                Share this invitation link with {formData.fullName} to complete their setup.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>Invitation Link</Label>
              <div className="flex space-x-2">
                <Input
                  value={invitationLink}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyInvitationLink}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Button onClick={sendInvitationEmail} variant="outline" className="w-full">
                <Send className="h-4 w-4 mr-2" />
                Send Invitation Email
              </Button>
            </div>

            <div className="flex space-x-2 pt-4">
              <Button onClick={handleClose} className="flex-1">
                Done
              </Button>
              <Button variant="outline" onClick={() => setStep('form')}>
                Create Another
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CreateEmployeeDialog;