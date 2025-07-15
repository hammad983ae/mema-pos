import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Star,
  Edit,
  MoreVertical,
  MessageSquare,
  User,
  Search,
  Loader2
} from "lucide-react";

interface TeamDirectoryProps {
  searchQuery: string;
  userRole: string;
}

interface TeamMember {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone?: string;
  position_type?: string;
  role: string;
  created_at: string;
  last_active?: string;
  store_name?: string;
}

export const TeamDirectory = ({ searchQuery, userRole }: TeamDirectoryProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedStore, setSelectedStore] = useState("all");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    if (user?.id && isMounted) {
      fetchTeamMembers();
    }
    
    return () => {
      isMounted = false;
      setTeamMembers([]);
    };
  }, [user?.id]);

  const fetchTeamMembers = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      
      const { data: userContext } = await supabase.rpc('get_user_business_context', {
        user_uuid: user.id
      });

      if (!userContext || userContext.length === 0) return;

      // Optimized single query with join
      const { data: teamData, error: teamError } = await supabase
        .from('user_business_memberships')
        .select(`
          user_id, role, created_at,
          profiles!inner(user_id, full_name, email, phone, position_type)
        `)
        .eq('business_id', userContext[0].business_id)
        .eq('is_active', true)
        .limit(50);

      if (teamError) throw teamError;

      if (!teamData || teamData.length === 0) {
        setTeamMembers([]);
        return;
      }

      const formattedMembers = teamData.map((member: any) => ({
        id: member.user_id,
        user_id: member.user_id,
        full_name: member.profiles?.full_name || 'Unknown',
        email: member.profiles?.email || '',
        phone: member.profiles?.phone || undefined,
        position_type: member.profiles?.position_type || undefined,
        role: member.role,
        created_at: member.created_at,
        last_active: 'Unknown'
      }));

      setTeamMembers(formattedMembers);
    } catch (error) {
      console.error('Error fetching team members:', error);
      toast({
        title: "Error",
        description: "Failed to load team members",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };


  const getRoleBadge = (role: string) => {
    const colors = {
      business_owner: "bg-primary/10 text-primary border-primary/20",
      manager: "bg-success/10 text-success border-success/20",
      employee: "bg-warning/10 text-warning border-warning/20",
      office: "bg-purple-100 text-purple-700 border-purple-200"
    };
    return colors[role as keyof typeof colors] || "bg-muted/10 text-muted-foreground border-muted/20";
  };

  const getPositionBadge = (position: string) => {
    const colors = {
      opener: "bg-blue-100 text-blue-700 border-blue-200",
      upseller: "bg-green-100 text-green-700 border-green-200",
      manager: "bg-purple-100 text-purple-700 border-purple-200"
    };
    return colors[position as keyof typeof colors] || "bg-muted/10 text-muted-foreground border-muted/20";
  };

  const filteredMembers = teamMembers.filter(member => 
    member.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (member.position_type && member.position_type.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const summary = {
    totalMembers: teamMembers.length,
    activeMembers: teamMembers.length,
    roles: [...new Set(teamMembers.map(m => m.role))].length,
    positions: [...new Set(teamMembers.map(m => m.position_type).filter(Boolean))].length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Directory Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Members</p>
                <p className="text-2xl font-bold text-foreground">{summary.totalMembers}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Members</p>
                <p className="text-2xl font-bold text-foreground">{summary.activeMembers}</p>
              </div>
              <User className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">User Roles</p>
                <p className="text-2xl font-bold text-foreground">{summary.roles}</p>
              </div>
              <Star className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Position Types</p>
                <p className="text-2xl font-bold text-foreground">{summary.positions}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Directory */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Team Directory</span>
            </CardTitle>
            <div className="flex items-center space-x-3">
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="business_owner">Business Owner</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="office">Office</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedStore} onValueChange={setSelectedStore}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Stores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Positions</SelectItem>
                  <SelectItem value="opener">Opener</SelectItem>
                  <SelectItem value="upseller">Upseller</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Join Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {member.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{member.full_name}</p>
                          <p className="text-sm text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getRoleBadge(member.role)}>
                        {member.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {member.position_type ? (
                        <Badge variant="outline" className={getPositionBadge(member.position_type)}>
                          {member.position_type.charAt(0).toUpperCase() + member.position_type.slice(1)}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-1 text-sm">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          <span>{member.email}</span>
                        </div>
                        {member.phone && (
                          <div className="flex items-center space-x-1 text-sm">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            <span>{member.phone}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                        Active
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1 text-sm">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span>{new Date(member.created_at).toLocaleDateString()}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between mt-6 pt-6 border-t">
            <div className="text-sm text-muted-foreground">
              Showing {filteredMembers.length} of {teamMembers.length} team members
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm">
                Export Directory
              </Button>
              <Button variant="outline" size="sm">
                Import Members
              </Button>
              <Button size="sm">
                Add New Member
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};