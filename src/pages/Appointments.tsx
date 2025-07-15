import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Users, Clock, Settings } from "lucide-react";
import { AppointmentCalendar } from "@/components/appointments/AppointmentCalendar";
import { WalkInManager } from "@/components/appointments/WalkInManager";

const Appointments = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <Tabs defaultValue="calendar" className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Appointments</h1>
            <TabsList>
              <TabsTrigger value="calendar" className="flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Calendar
              </TabsTrigger>
              <TabsTrigger value="walkins" className="flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Walk-Ins
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="calendar">
            <AppointmentCalendar />
          </TabsContent>

          <TabsContent value="walkins">
            <WalkInManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Appointments;