import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  CreditCard,
  Shield,
  AlertTriangle,
  FileText,
  Upload,
  Bot,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  Calendar,
  DollarSign,
  ArrowLeft,
  Plus,
  Search,
  Filter,
  Eye,
  Mail,
  Download,
  Brain,
  Target,
  Lightbulb
} from "lucide-react";

interface ChargebackDispute {
  id: string;
  case_number: string;
  transaction_id?: string;
  transaction_date: string;
  dispute_amount: number;
  currency: string;
  customer_name: string;
  customer_email?: string;
  chargeback_reason: string;
  chargeback_date: string;
  response_deadline: string;
  status: string;
  priority: string;
  bank_name?: string;
  bank_contact_info?: string;
  dispute_description?: string;
  ai_generated_response?: string;
  created_at: string;
  evidence_count?: number;
}

const ChargebackDisputes = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [disputes, setDisputes] = useState<ChargebackDispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState<ChargebackDispute | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [isNewDisputeOpen, setIsNewDisputeOpen] = useState(false);
  const [aiAnalysisLoading, setAiAnalysisLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string>("");

  // New dispute form state
  const [newDispute, setNewDispute] = useState({
    case_number: "",
    transaction_id: "",
    transaction_date: "",
    dispute_amount: "",
    currency: "USD",
    customer_name: "",
    customer_email: "",
    chargeback_reason: "",
    chargeback_date: "",
    response_deadline: "",
    priority: "medium",
    bank_name: "",
    bank_contact_info: "",
    dispute_description: ""
  });

  const [businessContext, setBusinessContext] = useState(null);

  useEffect(() => {
    loadBusinessContext();
  }, [user?.id]);

  useEffect(() => {
    if (businessContext?.business_id) {
      fetchDisputes();
    }
  }, [businessContext]);

  const loadBusinessContext = async () => {
    if (!user?.id) return;
    
    try {
      const { data: userContext } = await supabase.rpc('get_user_business_context', {
        user_uuid: user.id
      });

      if (userContext && userContext.length > 0) {
        setBusinessContext(userContext[0]);
      }
    } catch (error) {
      console.error('Error loading business context:', error);
    }
  };

  const fetchDisputes = async () => {
    if (!businessContext?.business_id) return;
    
    try {
      setLoading(true);

      // Fetch disputes with evidence count
      const { data, error } = await supabase
        .from('chargeback_disputes')
        .select(`
          *,
          evidence_count:chargeback_evidence(count)
        `)
        .eq('business_id', businessContext.business_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const disputesWithCount = data.map(dispute => ({
        ...dispute,
        evidence_count: dispute.evidence_count?.[0]?.count || 0
      }));

      setDisputes(disputesWithCount);
    } catch (error: any) {
      console.error('Error fetching disputes:', error);
      toast({
        title: "Error",
        description: "Failed to load chargeback disputes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createNewDispute = async () => {
    if (!businessContext?.business_id) {
      toast({
        title: "Error",
        description: "Business context not available",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('chargeback_disputes')
        .insert({
          ...newDispute,
          business_id: businessContext.business_id,
          created_by: user?.id,
          dispute_amount: parseFloat(newDispute.dispute_amount)
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Chargeback dispute case created successfully",
      });

      setIsNewDisputeOpen(false);
      setNewDispute({
        case_number: "",
        transaction_id: "",
        transaction_date: "",
        dispute_amount: "",
        currency: "USD",
        customer_name: "",
        customer_email: "",
        chargeback_reason: "",
        chargeback_date: "",
        response_deadline: "",
        priority: "medium",
        bank_name: "",
        bank_contact_info: "",
        dispute_description: ""
      });
      
      fetchDisputes();
    } catch (error: any) {
      console.error('Error creating dispute:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create dispute case",
        variant: "destructive",
      });
    }
  };

  const generateAIResponse = async (dispute: ChargebackDispute, customInstructions: string = "") => {
    setAiAnalysisLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('chargeback-dispute-ai', {
        body: {
          action: 'generate_dispute_response',
          disputeId: dispute.id,
          customInstructions
        }
      });

      if (error) throw error;

      setAiResponse(data.dispute_response);
      
      toast({
        title: "AI Response Generated",
        description: "Professional dispute response has been generated",
      });

      // Refresh the dispute to get the updated AI response
      fetchDisputes();
    } catch (error: any) {
      console.error('Error generating AI response:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate AI response",
        variant: "destructive",
      });
    } finally {
      setAiAnalysisLoading(false);
    }
  };

  const analyzeCaseStrength = async (dispute: ChargebackDispute) => {
    setAiAnalysisLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('chargeback-dispute-ai', {
        body: {
          action: 'analyze_case_strength',
          disputeId: dispute.id
        }
      });

      if (error) throw error;

      setAiResponse(data.case_analysis);
      
      toast({
        title: "Case Analysis Complete",
        description: "AI has analyzed your case strength",
      });
    } catch (error: any) {
      console.error('Error analyzing case:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to analyze case",
        variant: "destructive",
      });
    } finally {
      setAiAnalysisLoading(false);
    }
  };

  const suggestEvidence = async (dispute: ChargebackDispute) => {
    setAiAnalysisLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('chargeback-dispute-ai', {
        body: {
          action: 'suggest_evidence',
          disputeId: dispute.id
        }
      });

      if (error) throw error;

      setAiResponse(data.evidence_suggestions);
      
      toast({
        title: "Evidence Suggestions Ready",
        description: "AI has suggested evidence to collect",
      });
    } catch (error: any) {
      console.error('Error suggesting evidence:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to suggest evidence",
        variant: "destructive",
      });
    } finally {
      setAiAnalysisLoading(false);
    }
  };

  const draftBankEmail = async (dispute: ChargebackDispute, customInstructions: string = "") => {
    setAiAnalysisLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('chargeback-dispute-ai', {
        body: {
          action: 'draft_bank_email',
          disputeId: dispute.id,
          customInstructions
        }
      });

      if (error) throw error;

      setAiResponse(data.email_draft);
      
      toast({
        title: "Bank Email Drafted",
        description: "Professional email to bank has been generated",
      });
    } catch (error: any) {
      console.error('Error drafting email:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to draft email",
        variant: "destructive",
      });
    } finally {
      setAiAnalysisLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-500';
      case 'in_progress': return 'bg-yellow-500';
      case 'submitted': return 'bg-purple-500';
      case 'won': return 'bg-green-500';
      case 'lost': return 'bg-red-500';
      case 'expired': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getDaysUntilDeadline = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const filteredDisputes = disputes.filter(dispute => {
    const matchesSearch = 
      dispute.case_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dispute.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dispute.chargeback_reason.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || dispute.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || dispute.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const stats = {
    total: disputes.length,
    open: disputes.filter(d => d.status === 'open').length,
    in_progress: disputes.filter(d => d.status === 'in_progress').length,
    won: disputes.filter(d => d.status === 'won').length,
    urgent: disputes.filter(d => d.priority === 'urgent').length
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/employee')}
                className="hover:bg-primary/10"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
            
            <Dialog open={isNewDisputeOpen} onOpenChange={setIsNewDisputeOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  New Dispute Case
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Chargeback Dispute Case</DialogTitle>
                  <DialogDescription>
                    Enter the details of the chargeback dispute to start building your case
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="case_number">Case Number *</Label>
                      <Input
                        id="case_number"
                        value={newDispute.case_number}
                        onChange={(e) => setNewDispute(prev => ({ ...prev, case_number: e.target.value }))}
                        placeholder="CB-2024-001"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="transaction_id">Transaction ID</Label>
                      <Input
                        id="transaction_id"
                        value={newDispute.transaction_id}
                        onChange={(e) => setNewDispute(prev => ({ ...prev, transaction_id: e.target.value }))}
                        placeholder="TXN123456"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="transaction_date">Transaction Date *</Label>
                      <Input
                        id="transaction_date"
                        type="date"
                        value={newDispute.transaction_date}
                        onChange={(e) => setNewDispute(prev => ({ ...prev, transaction_date: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="chargeback_date">Chargeback Date *</Label>
                      <Input
                        id="chargeback_date"
                        type="date"
                        value={newDispute.chargeback_date}
                        onChange={(e) => setNewDispute(prev => ({ ...prev, chargeback_date: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dispute_amount">Amount *</Label>
                      <Input
                        id="dispute_amount"
                        type="number"
                        step="0.01"
                        value={newDispute.dispute_amount}
                        onChange={(e) => setNewDispute(prev => ({ ...prev, dispute_amount: e.target.value }))}
                        placeholder="1000.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currency">Currency</Label>
                      <Select
                        value={newDispute.currency}
                        onValueChange={(value) => setNewDispute(prev => ({ ...prev, currency: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="XCD">XCD</SelectItem>
                          <SelectItem value="BBD">BBD</SelectItem>
                          <SelectItem value="JMD">JMD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="priority">Priority</Label>
                      <Select
                        value={newDispute.priority}
                        onValueChange={(value) => setNewDispute(prev => ({ ...prev, priority: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="customer_name">Customer Name *</Label>
                      <Input
                        id="customer_name"
                        value={newDispute.customer_name}
                        onChange={(e) => setNewDispute(prev => ({ ...prev, customer_name: e.target.value }))}
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="customer_email">Customer Email</Label>
                      <Input
                        id="customer_email"
                        type="email"
                        value={newDispute.customer_email}
                        onChange={(e) => setNewDispute(prev => ({ ...prev, customer_email: e.target.value }))}
                        placeholder="customer@example.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="chargeback_reason">Chargeback Reason *</Label>
                    <Input
                      id="chargeback_reason"
                      value={newDispute.chargeback_reason}
                      onChange={(e) => setNewDispute(prev => ({ ...prev, chargeback_reason: e.target.value }))}
                      placeholder="Fraud, Non-receipt, Authorization, etc."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bank_name">Bank Name</Label>
                      <Input
                        id="bank_name"
                        value={newDispute.bank_name}
                        onChange={(e) => setNewDispute(prev => ({ ...prev, bank_name: e.target.value }))}
                        placeholder="First National Bank"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="response_deadline">Response Deadline *</Label>
                      <Input
                        id="response_deadline"
                        type="date"
                        value={newDispute.response_deadline}
                        onChange={(e) => setNewDispute(prev => ({ ...prev, response_deadline: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bank_contact_info">Bank Contact Information</Label>
                    <Textarea
                      id="bank_contact_info"
                      value={newDispute.bank_contact_info}
                      onChange={(e) => setNewDispute(prev => ({ ...prev, bank_contact_info: e.target.value }))}
                      placeholder="Email, phone, address for bank communications"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dispute_description">Dispute Description</Label>
                    <Textarea
                      id="dispute_description"
                      value={newDispute.dispute_description}
                      onChange={(e) => setNewDispute(prev => ({ ...prev, dispute_description: e.target.value }))}
                      placeholder="Additional details about the dispute..."
                      rows={3}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsNewDisputeOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createNewDispute}>
                    Create Dispute Case
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Chargeback Disputes</h1>
          </div>
          <p className="text-muted-foreground">
            AI-powered chargeback dispute management for Caribbean businesses
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Cases</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <CreditCard className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Open</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.open}</p>
                </div>
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.in_progress}</p>
                </div>
                <FileText className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Won</p>
                  <p className="text-2xl font-bold text-green-600">{stats.won}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Urgent</p>
                  <p className="text-2xl font-bold text-red-600">{stats.urgent}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by case number, customer, or reason..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="won">Won</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Disputes List */}
        <div className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading disputes...</p>
              </CardContent>
            </Card>
          ) : filteredDisputes.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Disputes Found</h3>
                <p className="text-muted-foreground mb-4">
                  {disputes.length === 0 
                    ? "Create your first chargeback dispute case to get started"
                    : "No disputes match your current filters"
                  }
                </p>
                {disputes.length === 0 && (
                  <Button onClick={() => setIsNewDisputeOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Case
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredDisputes.map((dispute) => {
              const daysLeft = getDaysUntilDeadline(dispute.response_deadline);
              return (
                <Card key={dispute.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{dispute.case_number}</h3>
                          <Badge className={`${getStatusColor(dispute.status)} text-white`}>
                            {dispute.status.replace('_', ' ')}
                          </Badge>
                          <Badge className={`${getPriorityColor(dispute.priority)} text-white`}>
                            {dispute.priority}
                          </Badge>
                          {daysLeft <= 3 && daysLeft > 0 && (
                            <Badge variant="destructive">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {daysLeft} days left
                            </Badge>
                          )}
                          {daysLeft <= 0 && (
                            <Badge variant="destructive">
                              <XCircle className="h-3 w-3 mr-1" />
                              OVERDUE
                            </Badge>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Customer</p>
                            <p className="font-medium">{dispute.customer_name}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Amount</p>
                            <p className="font-medium">{dispute.currency} {dispute.dispute_amount}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Reason</p>
                            <p className="font-medium">{dispute.chargeback_reason}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Deadline</p>
                            <p className="font-medium">
                              {new Date(dispute.response_deadline).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            {dispute.evidence_count} evidence files
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Created {new Date(dispute.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedDispute(dispute)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5" />
                                Dispute Case: {dispute.case_number}
                              </DialogTitle>
                              <DialogDescription>
                                Manage your chargeback dispute with AI assistance
                              </DialogDescription>
                            </DialogHeader>
                            
                            <Tabs defaultValue="details" className="w-full">
                              <TabsList className="grid w-full grid-cols-4">
                                <TabsTrigger value="details">Details</TabsTrigger>
                                <TabsTrigger value="evidence">Evidence</TabsTrigger>
                                <TabsTrigger value="ai-assistant">AI Assistant</TabsTrigger>
                                <TabsTrigger value="response">Response</TabsTrigger>
                              </TabsList>
                              
                              <TabsContent value="details" className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="text-base">Case Information</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                      <div>
                                        <Label className="text-sm text-muted-foreground">Case Number</Label>
                                        <p>{dispute.case_number}</p>
                                      </div>
                                      <div>
                                        <Label className="text-sm text-muted-foreground">Transaction ID</Label>
                                        <p>{dispute.transaction_id || 'N/A'}</p>
                                      </div>
                                      <div>
                                        <Label className="text-sm text-muted-foreground">Amount</Label>
                                        <p className="text-lg font-semibold">{dispute.currency} {dispute.dispute_amount}</p>
                                      </div>
                                      <div>
                                        <Label className="text-sm text-muted-foreground">Status</Label>
                                        <Badge className={`${getStatusColor(dispute.status)} text-white`}>
                                          {dispute.status.replace('_', ' ')}
                                        </Badge>
                                      </div>
                                    </CardContent>
                                  </Card>
                                  
                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="text-base">Timeline</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                      <div>
                                        <Label className="text-sm text-muted-foreground">Transaction Date</Label>
                                        <p>{new Date(dispute.transaction_date).toLocaleDateString()}</p>
                                      </div>
                                      <div>
                                        <Label className="text-sm text-muted-foreground">Chargeback Date</Label>
                                        <p>{new Date(dispute.chargeback_date).toLocaleDateString()}</p>
                                      </div>
                                      <div>
                                        <Label className="text-sm text-muted-foreground">Response Deadline</Label>
                                        <p className={daysLeft <= 3 ? 'text-red-600 font-semibold' : ''}>
                                          {new Date(dispute.response_deadline).toLocaleDateString()}
                                          {daysLeft > 0 ? ` (${daysLeft} days left)` : ' (OVERDUE)'}
                                        </p>
                                      </div>
                                      <div>
                                        <Label className="text-sm text-muted-foreground">Priority</Label>
                                        <Badge className={`${getPriorityColor(dispute.priority)} text-white`}>
                                          {dispute.priority}
                                        </Badge>
                                      </div>
                                    </CardContent>
                                  </Card>
                                </div>
                                
                                <Card>
                                  <CardHeader>
                                    <CardTitle className="text-base">Customer & Bank Information</CardTitle>
                                  </CardHeader>
                                  <CardContent className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <div>
                                        <Label className="text-sm text-muted-foreground">Customer Name</Label>
                                        <p>{dispute.customer_name}</p>
                                      </div>
                                      <div>
                                        <Label className="text-sm text-muted-foreground">Customer Email</Label>
                                        <p>{dispute.customer_email || 'N/A'}</p>
                                      </div>
                                    </div>
                                    <div className="space-y-2">
                                      <div>
                                        <Label className="text-sm text-muted-foreground">Bank Name</Label>
                                        <p>{dispute.bank_name || 'N/A'}</p>
                                      </div>
                                      <div>
                                        <Label className="text-sm text-muted-foreground">Bank Contact</Label>
                                        <p className="text-sm">{dispute.bank_contact_info || 'N/A'}</p>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                                
                                <Card>
                                  <CardHeader>
                                    <CardTitle className="text-base">Dispute Details</CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="space-y-2">
                                      <div>
                                        <Label className="text-sm text-muted-foreground">Chargeback Reason</Label>
                                        <p>{dispute.chargeback_reason}</p>
                                      </div>
                                      {dispute.dispute_description && (
                                        <div>
                                          <Label className="text-sm text-muted-foreground">Description</Label>
                                          <p className="text-sm">{dispute.dispute_description}</p>
                                        </div>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
                              </TabsContent>
                              
                              <TabsContent value="evidence" className="space-y-4">
                                <div className="text-center py-8">
                                  <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                  <h3 className="text-lg font-semibold mb-2">Evidence Management</h3>
                                  <p className="text-muted-foreground mb-4">
                                    Upload receipts, signatures, and supporting documents
                                  </p>
                                  <Button>
                                    <Upload className="h-4 w-4 mr-2" />
                                    Upload Evidence
                                  </Button>
                                </div>
                              </TabsContent>
                              
                              <TabsContent value="ai-assistant" className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="text-base flex items-center gap-2">
                                        <Brain className="h-4 w-4" />
                                        AI Analysis
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                      <Button 
                                        variant="outline" 
                                        className="w-full justify-start"
                                        onClick={() => analyzeCaseStrength(dispute)}
                                        disabled={aiAnalysisLoading}
                                      >
                                        <Target className="h-4 w-4 mr-2" />
                                        Analyze Case Strength
                                      </Button>
                                      <Button 
                                        variant="outline" 
                                        className="w-full justify-start"
                                        onClick={() => suggestEvidence(dispute)}
                                        disabled={aiAnalysisLoading}
                                      >
                                        <Lightbulb className="h-4 w-4 mr-2" />
                                        Suggest Evidence
                                      </Button>
                                    </CardContent>
                                  </Card>
                                  
                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="text-base flex items-center gap-2">
                                        <Bot className="h-4 w-4" />
                                        AI Generation
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                      <Button 
                                        variant="outline" 
                                        className="w-full justify-start"
                                        onClick={() => generateAIResponse(dispute)}
                                        disabled={aiAnalysisLoading}
                                      >
                                        <FileText className="h-4 w-4 mr-2" />
                                        Generate Response
                                      </Button>
                                      <Button 
                                        variant="outline" 
                                        className="w-full justify-start"
                                        onClick={() => draftBankEmail(dispute)}
                                        disabled={aiAnalysisLoading}
                                      >
                                        <Mail className="h-4 w-4 mr-2" />
                                        Draft Bank Email
                                      </Button>
                                    </CardContent>
                                  </Card>
                                </div>
                                
                                {aiAnalysisLoading && (
                                  <Card>
                                    <CardContent className="p-6 text-center">
                                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                                      <p className="text-muted-foreground">AI is analyzing your case...</p>
                                    </CardContent>
                                  </Card>
                                )}
                                
                                {aiResponse && (
                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="text-base flex items-center gap-2">
                                        <Bot className="h-4 w-4" />
                                        AI Response
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="bg-muted p-4 rounded-lg">
                                        <pre className="whitespace-pre-wrap text-sm">{aiResponse}</pre>
                                      </div>
                                      <div className="flex gap-2 mt-4">
                                        <Button 
                                          variant="outline" 
                                          size="sm"
                                          onClick={() => {
                                            navigator.clipboard.writeText(aiResponse);
                                            toast({ title: "Copied to clipboard" });
                                          }}
                                        >
                                          Copy
                                        </Button>
                                        <Button 
                                          variant="outline" 
                                          size="sm"
                                        >
                                          <Download className="h-4 w-4 mr-2" />
                                          Download
                                        </Button>
                                      </div>
                                    </CardContent>
                                  </Card>
                                )}
                              </TabsContent>
                              
                              <TabsContent value="response" className="space-y-4">
                                {dispute.ai_generated_response ? (
                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="text-base">Generated Dispute Response</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="bg-muted p-4 rounded-lg mb-4">
                                        <pre className="whitespace-pre-wrap text-sm">{dispute.ai_generated_response}</pre>
                                      </div>
                                      <div className="flex gap-2">
                                        <Button>
                                          <Mail className="h-4 w-4 mr-2" />
                                          Send to Bank
                                        </Button>
                                        <Button variant="outline">
                                          <Download className="h-4 w-4 mr-2" />
                                          Download PDF
                                        </Button>
                                      </div>
                                    </CardContent>
                                  </Card>
                                ) : (
                                  <Card>
                                    <CardContent className="p-8 text-center">
                                      <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                      <h3 className="text-lg font-semibold mb-2">No Response Generated</h3>
                                      <p className="text-muted-foreground mb-4">
                                        Use the AI Assistant to generate a professional dispute response
                                      </p>
                                      <Button onClick={() => generateAIResponse(dispute)}>
                                        <Bot className="h-4 w-4 mr-2" />
                                        Generate AI Response
                                      </Button>
                                    </CardContent>
                                  </Card>
                                )}
                              </TabsContent>
                            </Tabs>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default ChargebackDisputes;