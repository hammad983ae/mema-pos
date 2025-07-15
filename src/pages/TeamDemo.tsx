import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Clock, 
  Calendar, 
  DollarSign, 
  Award,
  ArrowLeft,
  Plus,
  MoreHorizontal,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Target
} from "lucide-react";
import { Link } from "react-router-dom";

const TeamDemo = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const teamMembers = [
    {
      id: 1,
      name: "Sarah Martinez",
      role: "Senior Esthetician",
      status: "active",
      avatar: "/placeholder.svg",
      totalSales: 4500,
      commission: 450,
      hoursWorked: 38,
      customerRating: 4.9,
      shiftsThisWeek: 5,
      todaySchedule: "9:00 AM - 5:00 PM"
    },
    {
      id: 2,
      name: "Emma Kim",
      role: "Beauty Specialist",
      status: "active",
      avatar: "/placeholder.svg",
      totalSales: 3800,
      commission: 380,
      hoursWorked: 35,
      customerRating: 4.8,
      shiftsThisWeek: 5,
      todaySchedule: "10:00 AM - 6:00 PM"
    },
    {
      id: 3,
      name: "Lisa Rodriguez",
      role: "Junior Esthetician",
      status: "break",
      avatar: "/placeholder.svg",
      totalSales: 3200,
      commission: 320,
      hoursWorked: 32,
      customerRating: 4.7,
      shiftsThisWeek: 4,
      todaySchedule: "11:00 AM - 7:00 PM"
    },
    {
      id: 4,
      name: "Anna Thompson",
      role: "Receptionist",
      status: "off",
      avatar: "/placeholder.svg",
      totalSales: 2900,
      commission: 290,
      hoursWorked: 40,
      customerRating: 4.6,
      shiftsThisWeek: 5,
      todaySchedule: "Off Today"
    }
  ];

  const scheduleData = [
    { time: "9:00 AM", sarah: "Facial - Client A", emma: "", lisa: "", anna: "Opening Tasks" },
    { time: "10:00 AM", sarah: "Consultation", emma: "Product Demo", lisa: "", anna: "Front Desk" },
    { time: "11:00 AM", sarah: "Chemical Peel", emma: "Microderm", lisa: "Training", anna: "Customer Calls" },
    { time: "12:00 PM", sarah: "Lunch Break", emma: "Facial Treatment", lisa: "Eye Treatment", anna: "Lunch Break" },
    { time: "1:00 PM", sarah: "Back Facial", emma: "Lunch Break", lisa: "Product Sales", anna: "Inventory" },
    { time: "2:00 PM", sarah: "Consultation", emma: "Consultation", lisa: "Facial Prep", anna: "Appointments" },
    { time: "3:00 PM", sarah: "HydraFacial", emma: "Dermaplaning", lisa: "Facial - Client B", anna: "Customer Service" },
    { time: "4:00 PM", sarah: "Product Training", emma: "Clean Up", lisa: "Product Demo", anna: "Closing Tasks" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'break': return 'bg-yellow-500';
      case 'off': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Working';
      case 'break': return 'On Break';
      case 'off': return 'Off Duty';
      default: return 'Unknown';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
              <h1 className="text-xl font-semibold">Team Management</h1>
              <Badge variant="outline">Demo Mode</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Team Member
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-4">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="timetracking">Time Tracking</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Team Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold">4</div>
                      <div className="text-sm text-muted-foreground">Team Members</div>
                    </div>
                    <Users className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold">3</div>
                      <div className="text-sm text-muted-foreground">Currently Working</div>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold">145</div>
                      <div className="text-sm text-muted-foreground">Total Hours</div>
                    </div>
                    <Clock className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold">$14.4k</div>
                      <div className="text-sm text-muted-foreground">Total Sales</div>
                    </div>
                    <DollarSign className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Team Members Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
              {teamMembers.map((member) => (
                <Card key={member.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar>
                            <AvatarImage src={member.avatar} />
                            <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${getStatusColor(member.status)}`} />
                        </div>
                        <div>
                          <div className="font-semibold">{member.name}</div>
                          <div className="text-sm text-muted-foreground">{member.role}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{getStatusText(member.status)}</Badge>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm">
                      <strong>Today:</strong> {member.todaySchedule}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">This Week</div>
                        <div className="font-medium">{member.hoursWorked}h worked</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Rating</div>
                        <div className="font-medium flex items-center gap-1">
                          ⭐ {member.customerRating}
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Sales</div>
                        <div className="font-medium">${member.totalSales.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Commission</div>
                        <div className="font-medium text-green-600">${member.commission}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Today's Schedule
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Time</th>
                        <th className="text-left p-2">Sarah M.</th>
                        <th className="text-left p-2">Emma K.</th>
                        <th className="text-left p-2">Lisa R.</th>
                        <th className="text-left p-2">Anna T.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scheduleData.map((slot, index) => (
                        <tr key={index} className="border-b hover:bg-muted/50">
                          <td className="p-2 font-medium">{slot.time}</td>
                          <td className="p-2">
                            {slot.sarah && (
                              <div className="text-sm bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">
                                {slot.sarah}
                              </div>
                            )}
                          </td>
                          <td className="p-2">
                            {slot.emma && (
                              <div className="text-sm bg-green-100 dark:bg-green-900 px-2 py-1 rounded">
                                {slot.emma}
                              </div>
                            )}
                          </td>
                          <td className="p-2">
                            {slot.lisa && (
                              <div className="text-sm bg-purple-100 dark:bg-purple-900 px-2 py-1 rounded">
                                {slot.lisa}
                              </div>
                            )}
                          </td>
                          <td className="p-2">
                            {slot.anna && (
                              <div className="text-sm bg-orange-100 dark:bg-orange-900 px-2 py-1 rounded">
                                {slot.anna}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Sales Leaders
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {teamMembers
                    .sort((a, b) => b.totalSales - a.totalSales)
                    .map((member, index) => (
                      <div key={member.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium">{member.name}</div>
                            <div className="text-sm text-muted-foreground">{member.role}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">${member.totalSales.toLocaleString()}</div>
                          <div className="text-sm text-green-600">+12% vs last week</div>
                        </div>
                      </div>
                    ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Goal Progress
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {teamMembers.map((member) => {
                    const goalProgress = Math.min((member.totalSales / 5000) * 100, 100);
                    return (
                      <div key={member.id} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{member.name}</span>
                          <span>${member.totalSales} / $5,000</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{ width: `${goalProgress}%` }}
                          />
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {goalProgress.toFixed(1)}% of monthly goal
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Time Tracking Tab */}
          <TabsContent value="timetracking" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Weekly Time Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {teamMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={member.avatar} />
                          <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{member.name}</div>
                          <div className="text-sm text-muted-foreground">{member.role}</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-6 text-center">
                        <div>
                          <div className="text-lg font-bold">{member.hoursWorked}h</div>
                          <div className="text-xs text-muted-foreground">Total Hours</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold">{member.shiftsThisWeek}</div>
                          <div className="text-xs text-muted-foreground">Shifts</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold">
                            {member.status === 'active' ? '6h 23m' : '0h'}
                          </div>
                          <div className="text-xs text-muted-foreground">Today</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold">95%</div>
                          <div className="text-xs text-muted-foreground">Attendance</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TeamDemo;