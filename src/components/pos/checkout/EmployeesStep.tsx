import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  Search,
  Users,
  UserCheck,
  DollarSign,
  Percent,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@apollo/client";
import {
  GET_EMPLOYEE_CLOCKS,
  GET_USERS_BY_BUSINESS,
  Query,
  QueryGetEmployeeClocksByBusinessArgs,
  QueryGetUsersByBusinessArgs,
} from "@/graphql";
import { useDebounce } from "@/hooks/useDebounce.ts";

interface Employee {
  id: string;
  username: string;
  full_name: string | null;
  position_type: string | null;
  is_clocked_in: boolean;
}

interface EmployeeSalesAllocation {
  employeeId: string;
  amount: number;
  percentage: number;
}

interface EmployeesStepProps {
  selectedSalesPeople: string[];
  onSalesPeopleChange: (employees: string[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export const EmployeesStep = ({
  selectedSalesPeople,
  onSalesPeopleChange,
  onNext,
  onBack,
}: EmployeesStepProps) => {
  const [clockedInPeople, setClockedInPeople] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [salesAllocations, setSalesAllocations] = useState<
    EmployeeSalesAllocation[]
  >([]);
  const [allocationMode, setAllocationMode] = useState<"percentage" | "amount">(
    "percentage",
  );
  const debouncedSearch = useDebounce(searchTerm, 500);

  const { data: allEmployeeData, loading: allLoading } = useQuery<
    Query,
    QueryGetUsersByBusinessArgs
  >(GET_USERS_BY_BUSINESS, { variables: { search: debouncedSearch } });
  const { data: clockedEmployeeData, loading: clockedLoading } = useQuery<
    Query,
    QueryGetEmployeeClocksByBusinessArgs
  >(GET_EMPLOYEE_CLOCKS, { variables: { filters: { is_active: true } } });

  // Get cart data for sales amount calculation
  const cartData = JSON.parse(
    localStorage.getItem("pos_cart") ||
      '{"items": [], "total": 0, "subtotal": 0}',
  );
  const subtotal = cartData.subtotal || cartData.total || 0; // Use subtotal (pre-tax) amount

  // Save selected employees and allocations to localStorage whenever they change
  useEffect(() => {
    const salesAlloc = localStorage.getItem("checkout_sales_team") ?? "[]";

    setSalesAllocations(JSON.parse(salesAlloc));
  }, []);

  // Save selected employees and allocations to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(
      "checkout_sales_team",
      JSON.stringify(salesAllocations),
    );
  }, [selectedSalesPeople, salesAllocations, allocationMode]);

  // Load saved data on component mount
  useEffect(() => {
    const saved = localStorage.getItem("checkout_sales_team");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.employees && Array.isArray(parsed.employees)) {
          onSalesPeopleChange(parsed.employees);
          if (parsed.allocations) {
            setSalesAllocations(parsed.allocations);
          }
          if (parsed.allocationMode) {
            setAllocationMode(parsed.allocationMode);
          }
        }
      } catch (error) {
        console.error("Error parsing saved sales team data:", error);
      }
    }
  }, []);

  // const fetchEmployees = async () => {
  //   try {
  //
  //     // Get currently clocked in users
  //     const { data: clockedIn, error: clockError } = await supabase
  //       .from("employee_clock_status")
  //       .select("user_id")
  //       .eq("business_id", businessId)
  //       .eq("is_active", true);
  //
  //     if (clockError) throw clockError;
  //
  //     const clockedInUserIds = new Set(clockedIn?.map((c) => c.user_id) || []);
  //
  //     const formattedPeople: Employee[] =
  //       allMembers?.map((member) => ({
  //         id: member.user_id,
  //         username: member.username || "Unknown",
  //         full_name: member.full_name,
  //         position_type: member.position_type,
  //         is_clocked_in: clockedInUserIds.has(member.user_id),
  //       })) || [];
  //
  //     setClockedInPeople(formattedPeople.filter((p) => p.is_clocked_in));
  //   } catch (error) {
  //     console.error("Error fetching employees:", error);
  //     toast({
  //       title: "Error",
  //       description: "Failed to load employees. Please try again.",
  //       variant: "destructive",
  //     });
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const recalculateAllocations = (employees: string[]) => {
    if (employees.length === 0) {
      setSalesAllocations([]);
      return;
    }

    // Create new allocations with equal split
    const equalPercentage = 100 / employees.length;
    const equalAmount = subtotal / employees.length;

    const newAllocations: EmployeeSalesAllocation[] = employees.map(
      (employeeId) => ({
        employeeId,
        percentage: Math.round(equalPercentage * 100) / 100,
        amount: Math.round(equalAmount * 100) / 100,
      }),
    );

    setSalesAllocations(newAllocations);
  };

  const toggleEmployeeSelection = (employeeId: string) => {
    const newSelection = selectedSalesPeople.includes(employeeId)
      ? selectedSalesPeople.filter((id) => id !== employeeId)
      : [...selectedSalesPeople, employeeId];

    onSalesPeopleChange(newSelection);
    recalculateAllocations(newSelection);
  };

  const updateAllocation = (
    employeeId: string,
    value: number,
    type: "percentage" | "amount",
  ) => {
    const newAllocations = salesAllocations.map((allocation) => {
      if (allocation.employeeId === employeeId) {
        if (type === "percentage") {
          const newPercentage = Math.max(0, Math.min(100, value));
          const newAmount = (subtotal * newPercentage) / 100;
          return {
            ...allocation,
            percentage: newPercentage,
            amount: Math.round(newAmount * 100) / 100,
          };
        } else {
          const newAmount = Math.max(0, Math.min(subtotal, value));
          const newPercentage = subtotal > 0 ? (newAmount / subtotal) * 100 : 0;
          return {
            ...allocation,
            amount: newAmount,
            percentage: Math.round(newPercentage * 100) / 100,
          };
        }
      }
      return allocation;
    });

    setSalesAllocations(newAllocations);
  };

  const autoDistributeEqually = () => {
    recalculateAllocations(selectedSalesPeople);
  };

  const selectAllClocked = () => {
    const clockedInIds = clockedInPeople.map((p) => p.id);
    onSalesPeopleChange(clockedInIds);
    recalculateAllocations(clockedInIds);
  };

  const clearSelection = () => {
    onSalesPeopleChange([]);
    setSalesAllocations([]);
  };

  const filteredPeople = showAll
    ? (allEmployeeData?.getUsersByBusiness ?? [])
    : (clockedEmployeeData?.getEmployeeClocksByBusiness ?? []);

  const getPositionBadgeVariant = (position: string | null) => {
    switch (position) {
      case "opener":
        return "default";
      case "upseller":
        return "secondary";
      case "manager":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getEmployeeById = (id: string) =>
    allEmployeeData?.getUsersByBusiness?.find((p) => p.id === id);

  const totalAllocatedPercentage = salesAllocations.reduce(
    (sum, allocation) => sum + allocation.percentage,
    0,
  );
  const totalAllocatedAmount = salesAllocations.reduce(
    (sum, allocation) => sum + allocation.amount,
    0,
  );

  if (allLoading || clockedLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p>Loading employees...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Select Employees
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search Employees</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by name or username..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAll(!showAll)}
              >
                {showAll ? "Show Active Only" : "Show All"}
              </Button>

              {!showAll && clockedInPeople.length > 0 && (
                <Button variant="outline" size="sm" onClick={selectAllClocked}>
                  Select All Active
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={clearSelection}
                disabled={selectedSalesPeople.length === 0}
              >
                Clear All
              </Button>
            </div>
          </div>

          {/* Selection Summary */}
          {selectedSalesPeople.length > 0 && (
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <UserCheck className="h-4 w-4 text-success" />
                <span className="font-medium">
                  {selectedSalesPeople.length} employee
                  {selectedSalesPeople.length === 1 ? "" : "s"} selected
                </span>
                <span className="text-muted-foreground">
                  • Sales Amount: ${subtotal.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* People Grid */}
          {!filteredPeople.length ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm
                ? "No employees found matching your search."
                : showAll
                  ? "No employees found."
                  : "No employees are currently active."}
              {!showAll && (
                <Button
                  variant="link"
                  className="mt-2"
                  onClick={() => setShowAll(true)}
                >
                  Show all employees instead
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredPeople.map((person) => (
                <div
                  key={person.id}
                  className={`
                    p-4 border rounded-lg cursor-pointer transition-all hover:shadow-sm
                    ${
                      selectedSalesPeople.includes(person.id)
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border hover:border-primary/50"
                    }
                  `}
                  onClick={() => toggleEmployeeSelection(person.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`
                        w-3 h-3 rounded-full flex-shrink-0
                        ${selectedSalesPeople.includes(person.id) ? "bg-primary" : "bg-muted"}
                      `}
                      />
                      <div>
                        <p className="font-medium">
                          {person.full_name || person.username}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          @{person.username}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {person.position_type && (
                        <Badge
                          variant={getPositionBadgeVariant(
                            person.position_type,
                          )}
                        >
                          {person.position_type}
                        </Badge>
                      )}
                      {person.is_clocked_in && (
                        <Badge variant="outline" className="text-green-600">
                          <Clock className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sales Allocation Section */}
      {selectedSalesPeople.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Sales Allocation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Allocation Mode and Controls */}
            <div className="flex justify-between items-center">
              <Tabs
                value={allocationMode}
                onValueChange={(value) =>
                  setAllocationMode(value as "percentage" | "amount")
                }
              >
                <TabsList>
                  <TabsTrigger
                    value="percentage"
                    className="flex items-center gap-2"
                  >
                    <Percent className="h-4 w-4" />
                    Percentage
                  </TabsTrigger>
                  <TabsTrigger
                    value="amount"
                    className="flex items-center gap-2"
                  >
                    <DollarSign className="h-4 w-4" />
                    Amount
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <Button
                variant="outline"
                size="sm"
                onClick={autoDistributeEqually}
              >
                Distribute Equally
              </Button>
            </div>

            {/* Total Summary */}
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="flex justify-between items-center text-sm">
                <span>Sales Total (Pre-tax):</span>
                <span className="font-medium">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>Allocated:</span>
                <span
                  className={`font-medium ${Math.abs(totalAllocatedPercentage - 100) > 0.01 || Math.abs(totalAllocatedAmount - subtotal) > 0.01 ? "text-amber-600" : "text-green-600"}`}
                >
                  {allocationMode === "percentage"
                    ? `${totalAllocatedPercentage.toFixed(1)}%`
                    : `$${totalAllocatedAmount.toFixed(2)}`}
                </span>
              </div>
            </div>

            {/* Individual Allocations */}
            <div className="space-y-3">
              {salesAllocations.map((allocation) => {
                const employee = getEmployeeById(allocation.employeeId);
                if (!employee) return null;

                return (
                  <div
                    key={allocation.employeeId}
                    className="border rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-medium">
                          {employee.full_name || employee.username}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          @{employee.username}
                        </p>
                      </div>
                      {employee.position_type && (
                        <Badge
                          variant={getPositionBadgeVariant(
                            employee.position_type,
                          )}
                        >
                          {employee.position_type}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <Label>
                          {allocationMode === "percentage"
                            ? "Percentage"
                            : "Amount"}
                        </Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="0"
                            max={
                              allocationMode === "percentage"
                                ? "100"
                                : subtotal.toString()
                            }
                            step={
                              allocationMode === "percentage" ? "0.1" : "0.01"
                            }
                            value={
                              allocationMode === "percentage"
                                ? allocation.percentage
                                : allocation.amount
                            }
                            onChange={(e) =>
                              updateAllocation(
                                allocation.employeeId,
                                parseFloat(e.target.value) || 0,
                                allocationMode,
                              )
                            }
                            className="text-center"
                          />
                          <span className="text-sm text-muted-foreground">
                            {allocationMode === "percentage" ? "%" : "$"}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <Label>Equivalent</Label>
                        <p className="text-sm font-medium">
                          {allocationMode === "percentage"
                            ? `$${allocation.amount.toFixed(2)}`
                            : `${allocation.percentage.toFixed(1)}%`}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between gap-4">
        <Button variant="outline" onClick={onBack}>
          Back to Payment
        </Button>

        <Button
          onClick={onNext}
          disabled={!selectedSalesPeople.length || !salesAllocations.length}
        >
          Complete Sale
        </Button>
      </div>
    </div>
  );
};
