import { EnhancedScheduleBuilder } from "./EnhancedScheduleBuilder";

interface SmartScheduleBuilderProps {
  userRole: string;
}

export const SmartScheduleBuilder = ({ userRole }: SmartScheduleBuilderProps) => {
  return <EnhancedScheduleBuilder userRole={userRole} />;
};