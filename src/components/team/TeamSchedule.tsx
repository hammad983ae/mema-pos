import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScheduleCalendar } from "./ScheduleCalendar";
import { ShiftTemplates } from "./ShiftTemplates";
import { TimeOffManager } from "./TimeOffManager";
import { ScheduleOverview } from "./ScheduleOverview";
import { Calendar, Clock, Layers, FileText } from "lucide-react";

interface TeamScheduleProps {
  userRole: string;
}

export const TeamSchedule = ({ userRole }: TeamScheduleProps) => {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="calendar" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Calendar View
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="timeoff" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Time Off
          </TabsTrigger>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Overview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar">
          <ScheduleCalendar userRole={userRole} />
        </TabsContent>

        <TabsContent value="templates">
          <ShiftTemplates userRole={userRole} />
        </TabsContent>

        <TabsContent value="timeoff">
          <TimeOffManager userRole={userRole} />
        </TabsContent>

        <TabsContent value="overview">
          <ScheduleOverview userRole={userRole} />
        </TabsContent>
      </Tabs>
    </div>
  );
};