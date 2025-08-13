import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Clock, LogIn, LogOut, User, Users, Timer } from "lucide-react";
import { useMutation, useQuery } from "@apollo/client";
import {
  CLOCK_IN,
  CLOCK_OUT,
  GET_EMPLOYEE_CLOCKS,
  GET_USER_ACTIVE_CLOCK,
  Mutation,
  MutationClockInArgs,
  PosSession,
  Query,
  QueryFindUserActiveEmployeeClockArgs,
  QueryGetEmployeeClocksByBusinessArgs,
} from "@/graphql";
import { useAuth } from "@/hooks/useAuth.tsx";
import { showSuccess } from "@/hooks/useToastMessages.tsx";

const ClockInManager = () => {
  const { user } = useAuth();
  const session = PosSession();
  const [clockIn, { loading: clockingIn }] = useMutation<
    Mutation,
    MutationClockInArgs
  >(CLOCK_IN);
  const [clockOut, { loading: clockingOut }] = useMutation<Mutation>(CLOCK_OUT);
  const {
    data: clockedEmployeeData,
    loading: clockedLoading,
    refetch: refetchEmployees,
  } = useQuery<Query, QueryGetEmployeeClocksByBusinessArgs>(
    GET_EMPLOYEE_CLOCKS,
    {
      variables: { filters: { is_active: true, store_id: session.store.id } },
      fetchPolicy: "network-only",
    },
  );
  const {
    data: currentEmployeeData,
    loading: currentLoading,
    refetch: refetchCurrent,
  } = useQuery<Query, QueryFindUserActiveEmployeeClockArgs>(
    GET_USER_ACTIVE_CLOCK,
    {
      variables: { userId: user.id },
      fetchPolicy: "network-only",
    },
  );

  const refetch = () => {
    refetchCurrent();
    refetchEmployees();
  };

  const handleClockIn = async () => {
    clockIn({
      variables: {
        storeId: session.store.id,
      },
    }).then(() => {
      showSuccess("You have clocked in successfully");

      refetch();
    });
  };

  const handleClockOut = async () => {
    if (!currentEmployeeData?.findUserActiveEmployeeClock) return;

    clockOut().then(() => {
      showSuccess("You have clocked out successfully");
      refetch();
    });
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTimeSinceClockIn = (timestamp: string) => {
    const now = new Date();
    const clockInTime = new Date(timestamp);
    const diffMs = now.getTime() - clockInTime.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`;
    }
    return `${diffMinutes}m`;
  };

  return (
    <div className="space-y-4">
      {/* Current Employee Clock Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Your Clock Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Timer className="h-4 w-4" />
                <span className="text-sm">
                  {currentEmployeeData?.findUserActiveEmployeeClock ? (
                    <>
                      Clocked in at{" "}
                      {formatTime(
                        currentEmployeeData?.findUserActiveEmployeeClock
                          .clocked_in_at,
                      )}
                      <Badge variant="secondary" className="ml-2">
                        {getTimeSinceClockIn(
                          currentEmployeeData?.findUserActiveEmployeeClock
                            .clocked_in_at,
                        )}
                      </Badge>
                    </>
                  ) : (
                    "Not clocked in"
                  )}
                </span>
              </div>
            </div>

            {currentEmployeeData?.findUserActiveEmployeeClock ? (
              <Button
                onClick={handleClockOut}
                disabled={clockingOut}
                variant="outline"
                className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Clock Out
              </Button>
            ) : (
              <Button
                onClick={handleClockIn}
                disabled={clockingIn}
                className="bg-success hover:bg-success/90"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Clock In
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Currently Clocked In Employees */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            Clocked In Employees (
            {clockedEmployeeData?.getEmployeeClocksByBusiness.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {clockedEmployeeData?.getEmployeeClocksByBusiness.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No employees currently clocked in</p>
            </div>
          ) : (
            <div className="space-y-3">
              {clockedEmployeeData?.getEmployeeClocksByBusiness.map(
                (employee) => (
                  <div
                    key={employee.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={employee.user.avatar_url} />
                        <AvatarFallback>
                          {employee.user.full_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{employee.user.full_name}</p>
                        <p className="text-sm text-muted-foreground">
                          @{employee.user.username}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        Since {formatTime(employee.clocked_in_at)}
                      </p>
                      <Badge variant="outline">
                        {getTimeSinceClockIn(employee.clocked_in_at)}
                      </Badge>
                    </div>
                  </div>
                ),
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClockInManager;
