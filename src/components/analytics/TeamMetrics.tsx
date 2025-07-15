import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Trophy, Star, TrendingUp, Users, Award, Target } from "lucide-react";

const teamData = [
  {
    id: "emp-001",
    name: "Sarah Johnson",
    role: "Store Manager",
    store: "Downtown Flagship",
    avatar: "/api/placeholder/32/32",
    initials: "SJ",
    sales: 18420,
    target: 15000,
    customers: 89,
    rating: 4.9,
    performance: 122.8,
    streak: 12,
    rank: 1
  },
  {
    id: "emp-002", 
    name: "Michael Chen",
    role: "Sales Associate",
    store: "Beverly Hills Spa",
    avatar: "/api/placeholder/32/32",
    initials: "MC",
    sales: 16890,
    target: 14000,
    customers: 76,
    rating: 4.8,
    performance: 120.6,
    streak: 8,
    rank: 2
  },
  {
    id: "emp-003",
    name: "Emma Davis",
    role: "Esthetician",
    store: "SoHo Boutique",
    avatar: "/api/placeholder/32/32",
    initials: "ED",
    sales: 15650,
    target: 13000,
    customers: 68,
    rating: 4.9,
    performance: 120.4,
    streak: 15,
    rank: 3
  },
  {
    id: "emp-004",
    name: "James Wilson",
    role: "Sales Associate",
    store: "Malibu Wellness",
    avatar: "/api/placeholder/32/32",
    initials: "JW",
    sales: 14230,
    target: 12000,
    customers: 62,
    rating: 4.7,
    performance: 118.6,
    streak: 5,
    rank: 4
  },
  {
    id: "emp-005",
    name: "Lisa Rodriguez",
    role: "Assistant Manager",
    store: "Union Square",
    avatar: "/api/placeholder/32/32",
    initials: "LR",
    sales: 13890,
    target: 12500,
    customers: 58,
    rating: 4.8,
    performance: 111.1,
    streak: 7,
    rank: 5
  }
];

const performanceData = [
  { week: "Week 1", teamAvg: 98.2, topPerformer: 115.6 },
  { week: "Week 2", teamAvg: 102.4, topPerformer: 118.9 },
  { week: "Week 3", teamAvg: 105.8, topPerformer: 122.1 },
  { week: "Week 4", teamAvg: 108.3, topPerformer: 125.4 },
];

const roleData = [
  { role: "Store Manager", avgSales: 16800, count: 45 },
  { role: "Sales Associate", avgSales: 14200, count: 98 },
  { role: "Esthetician", avgSales: 13500, count: 67 },
  { role: "Assistant Manager", avgSales: 12900, count: 32 },
];

interface TeamMetricsProps {
  dateRange: { from: Date; to: Date };
  selectedStore: string;
}

export const TeamMetrics = ({ dateRange, selectedStore }: TeamMetricsProps) => {
  return (
    <div className="space-y-6">
      {/* Team Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Performance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">108.3%</div>
            <p className="text-xs text-muted-foreground">vs target this week</p>
            <div className="mt-4">
              <Progress value={108.3} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Performer</CardTitle>
            <Trophy className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Sarah J.</div>
            <p className="text-xs text-muted-foreground">122.8% performance</p>
            <div className="flex items-center mt-2">
              <Star className="h-3 w-3 text-warning mr-1" />
              <span className="text-xs">12-day streak</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Size</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">242</div>
            <p className="text-xs text-muted-foreground">active team members</p>
            <div className="flex items-center mt-2">
              <div className="w-2 h-2 bg-success rounded-full mr-2" />
              <span className="text-xs">238 online today</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Team Performance Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip 
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "6px"
                }}
              />
              <Line 
                type="monotone" 
                dataKey="teamAvg" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ fill: "hsl(var(--primary))", strokeWidth: 2 }}
                name="Team Average"
              />
              <Line 
                type="monotone" 
                dataKey="topPerformer" 
                stroke="hsl(var(--warning))" 
                strokeWidth={2}
                dot={{ fill: "hsl(var(--warning))", strokeWidth: 2 }}
                name="Top Performer"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Leaderboard */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Sales Leaderboard</CardTitle>
          <Badge variant="outline">Today's Rankings</Badge>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {teamData.map((member, index) => (
              <div key={member.id} className="flex items-center justify-between p-4 rounded-lg bg-pos-accent/20">
                <div className="flex items-center space-x-4">
                  <div className={`
                    flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold
                    ${index < 3 ? 'bg-warning text-warning-foreground' : 'bg-muted text-muted-foreground'}
                  `}>
                    {member.rank}
                  </div>
                  
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={member.avatar} alt={member.name} />
                    <AvatarFallback>{member.initials}</AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-semibold">{member.name}</h4>
                      {member.streak >= 10 && (
                        <Badge variant="outline" className="text-xs">
                          <Star className="h-3 w-3 mr-1" />
                          {member.streak} days
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {member.role} • {member.store}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <p className="font-semibold">${member.sales.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">
                      Target: ${member.target.toLocaleString()}
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-semibold">{member.customers}</p>
                    <p className="text-sm text-muted-foreground">Customers</p>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-warning mr-1" />
                      <span className="font-semibold">{member.rating}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Rating</p>
                  </div>
                  
                  <Badge 
                    variant={member.performance >= 120 ? "default" : "secondary"}
                    className={
                      member.performance >= 120 ? 'bg-success text-success-foreground' : ''
                    }
                  >
                    {member.performance}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Role Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Performance by Role</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={roleData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="role" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip 
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "6px"
                }}
              />
              <Bar dataKey="avgSales" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};