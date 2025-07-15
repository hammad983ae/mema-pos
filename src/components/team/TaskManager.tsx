import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskAssignments } from "./tasks/TaskAssignments";
import { Checklists } from "./tasks/Checklists";
import { MaintenanceSchedules } from "./tasks/MaintenanceSchedules";
import { TaskCompletions } from "./tasks/TaskCompletions";
import { ClipboardList, Calendar, Wrench, CheckSquare } from "lucide-react";

interface TaskManagerProps {
  userRole: string;
}

export const TaskManager = ({ userRole }: TaskManagerProps) => {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="assignments" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="assignments" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Task Assignments
          </TabsTrigger>
          <TabsTrigger value="checklists" className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4" />
            Checklists
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Maintenance
          </TabsTrigger>
          <TabsTrigger value="completions" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Completions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assignments">
          <TaskAssignments userRole={userRole} />
        </TabsContent>

        <TabsContent value="checklists">
          <Checklists userRole={userRole} />
        </TabsContent>

        <TabsContent value="maintenance">
          <MaintenanceSchedules userRole={userRole} />
        </TabsContent>

        <TabsContent value="completions">
          <TaskCompletions userRole={userRole} />
        </TabsContent>
      </Tabs>
    </div>
  );
};