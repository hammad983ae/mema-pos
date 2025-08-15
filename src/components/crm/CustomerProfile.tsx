import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Phone,
  Mail,
  Calendar,
  DollarSign,
  Star,
  MapPin,
  Gift,
  Edit,
  MessageCircle,
  History,
  Shield,
  FileText,
  PenTool,
} from "lucide-react";
import { format } from "date-fns";
import { GET_CUSTOMER_BY_ID, Query, QueryGetCustomerByIdArgs } from "@/graphql";
import { useQuery } from "@apollo/client";

interface CustomerProfileProps {
  customerId: string;
  onEdit: () => void;
  onClose: () => void;
}

export const CustomerProfile = ({
  customerId,
  onEdit,
  onClose,
}: CustomerProfileProps) => {
  const [visits, setVisits] = useState<any[]>([]);
  const [preferences, setPreferences] = useState<any[]>([]);
  const [communications, setCommunications] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const { data, loading, refetch } = useQuery<Query, QueryGetCustomerByIdArgs>(
    GET_CUSTOMER_BY_ID,
    {
      variables: {
        id: customerId,
      },
      fetchPolicy: "network-only",
    },
  );

  // const fetchCustomerData = async () => {
  //   try {
  //     setLoading(true);
  //
  //     // Fetch customer details
  //     const { data: customerData, error: customerError } = await supabase
  //       .from("customers")
  //       .select("*")
  //       .eq("id", customerId)
  //       .single();
  //
  //     if (customerError) throw customerError;
  //     setCustomer(customerData);
  //
  //     // Fetch visits
  //     const { data: visitsData } = await supabase
  //       .from("customer_visits")
  //       .select("*")
  //       .eq("customer_id", customerId)
  //       .order("visit_date", { ascending: false });
  //
  //     setVisits(visitsData || []);
  //
  //     // Fetch preferences
  //     const { data: preferencesData } = await supabase
  //       .from("customer_preferences")
  //       .select("*")
  //       .eq("customer_id", customerId);
  //
  //     setPreferences(preferencesData || []);
  //
  //     // Fetch communications
  //     const { data: communicationsData } = await supabase
  //       .from("customer_communications")
  //       .select("*")
  //       .eq("customer_id", customerId)
  //       .order("sent_at", { ascending: false });
  //
  //     setCommunications(communicationsData || []);
  //
  //     // Fetch order history
  //     const { data: ordersData } = await supabase
  //       .from("orders")
  //       .select(
  //         `
  //         *,
  //         order_items(
  //           *,
  //           products(name, price)
  //         )
  //       `,
  //       )
  //       .eq("customer_id", customerId)
  //       .order("created_at", { ascending: false });
  //
  //     setOrders(ordersData || []);
  //   } catch (error: any) {
  //     console.error("Error fetching customer data:", error);
  //     toast({
  //       title: "Error",
  //       description: "Failed to load customer data",
  //       variant: "destructive",
  //     });
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        Loading customer profile...
      </div>
    );
  }

  if (!data?.getCustomerById) {
    return (
      <div className="text-center text-muted-foreground">
        Customer not found
      </div>
    );
  }

  const customerName = `${data?.getCustomerById.first_name} ${data?.getCustomerById.last_name}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="text-lg">
              {data?.getCustomerById.first_name?.charAt(0)}
              {data?.getCustomerById.last_name?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-2xl font-bold">{customerName}</h2>
            <p className="text-muted-foreground">
              Customer since{" "}
              {format(
                new Date(data?.getCustomerById.last_visit_date || new Date()),
                "MMM yyyy",
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="flex items-center gap-2"
          >
            ← Back
          </Button>
          <Button variant="outline" onClick={onEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Spent</p>
                <p className="text-lg font-semibold">
                  $
                  {Number(data?.getCustomerById.total_spent)?.toFixed(2) ||
                    "0.00"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <History className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Visits</p>
                <p className="text-lg font-semibold">
                  {data?.getCustomerById.visit_count || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Gift className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Loyalty Points</p>
                <p className="text-lg font-semibold">
                  {data?.getCustomerById.loyalty_points || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Last Visit</p>
                <p className="text-lg font-semibold">
                  {data?.getCustomerById.last_visit_date
                    ? format(
                        new Date(data?.getCustomerById.last_visit_date),
                        "MMM dd",
                      )
                    : "Never"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customer Details & History */}
      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="verification">Verification</TabsTrigger>
          <TabsTrigger value="visits">Visit History</TabsTrigger>
          <TabsTrigger value="orders">Purchase History</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="communications">Communications</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{data?.getCustomerById.email || "No email"}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{data?.getCustomerById.phone || "No phone"}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {data?.getCustomerById.date_of_birth
                      ? format(
                          new Date(data?.getCustomerById.date_of_birth),
                          "MMM dd, yyyy",
                        )
                      : "No birthday set"}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Address Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start space-x-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                  <div className="flex-1">
                    {data?.getCustomerById.address_line_1 ? (
                      <div className="space-y-1">
                        <div>{data?.getCustomerById.address_line_1}</div>
                        {data?.getCustomerById.address_line_2 && (
                          <div>{data?.getCustomerById.address_line_2}</div>
                        )}
                        <div>
                          {data?.getCustomerById.city &&
                            `${data?.getCustomerById.city}, `}
                          {data?.getCustomerById.state_province &&
                            `${data?.getCustomerById.state_province} `}
                          {data?.getCustomerById.postal_code}
                        </div>
                        {data?.getCustomerById.country && (
                          <div>{data?.getCustomerById.country}</div>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">
                        No address on file
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Verification Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {data?.getCustomerById.verification_date
                      ? "Verified Customer"
                      : "Unverified"}
                  </span>
                  <Badge
                    variant={
                      data?.getCustomerById.verification_date
                        ? "default"
                        : "secondary"
                    }
                  >
                    {data?.getCustomerById.verification_date
                      ? "Verified"
                      : "Pending"}
                  </Badge>
                </div>
                {data?.getCustomerById.verification_date && (
                  <div className="text-sm text-muted-foreground">
                    Verified on{" "}
                    {format(
                      new Date(data?.getCustomerById.verification_date),
                      "MMM dd, yyyy",
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Skin Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Skin Type
                  </p>
                  <Badge variant="outline">
                    {data?.getCustomerById.skin_type || "Not specified"}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Skin Concerns
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {data?.getCustomerById.skin_concerns?.length > 0 ? (
                      data?.getCustomerById.skin_concerns.map(
                        (concern, index) => (
                          <Badge key={index} variant="secondary">
                            {concern}
                          </Badge>
                        ),
                      )
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        None specified
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {data?.getCustomerById.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{data?.getCustomerById.notes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="verification" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data?.getCustomerById.id_document_path && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5" />
                    <span>ID Document</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Document Type
                    </p>
                    <Badge variant="outline">
                      {data?.getCustomerById.id_document_type}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Document Preview
                    </p>
                    <div className="border rounded-lg p-4 bg-muted/30">
                      <p className="text-sm text-center text-muted-foreground">
                        ID document on file
                      </p>
                      <p className="text-xs text-center text-muted-foreground mt-1">
                        {data?.getCustomerById.id_document_path}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {data?.getCustomerById.signature_path && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <PenTool className="h-5 w-5" />
                    <span>Customer Signature</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Signature on File
                    </p>
                    <div className="border rounded-lg p-4 bg-muted/30">
                      <p className="text-sm text-center text-muted-foreground">
                        Digital signature captured
                      </p>
                      <p className="text-xs text-center text-muted-foreground mt-1">
                        {data?.getCustomerById.signature_path}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {!data?.getCustomerById.id_document_path &&
              !data?.getCustomerById.signature_path && (
                <Card className="md:col-span-2">
                  <CardContent className="p-8 text-center text-muted-foreground">
                    <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="font-medium mb-2">
                      No Verification Documents
                    </h3>
                    <p className="text-sm">
                      No ID document or signature has been uploaded for this
                      customer.
                    </p>
                  </CardContent>
                </Card>
              )}
          </div>

          {data?.getCustomerById.verification_date && (
            <Card>
              <CardHeader>
                <CardTitle>Verification Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Verification Date:
                    </span>
                    <span className="text-sm">
                      {format(
                        new Date(data?.getCustomerById.verification_date),
                        "PPP",
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Documents Status:
                    </span>
                    <Badge variant="default">Complete</Badge>
                  </div>
                  <div className="mt-4 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-600">
                        Chargeback Protection Active
                      </span>
                    </div>
                    <p className="text-xs text-green-600 mt-1">
                      Customer identity verified with supporting documentation
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="visits" className="space-y-4">
          {visits.length > 0 ? (
            visits.map((visit) => (
              <Card key={visit.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Badge>{visit.visit_type}</Badge>
                      <span className="font-medium">
                        {format(new Date(visit.visit_date), "MMM dd, yyyy")}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">
                        ${visit.total_spent}
                      </span>
                      {visit.satisfaction_rating && (
                        <div className="flex items-center">
                          {[...Array(visit.satisfaction_rating)].map((_, i) => (
                            <Star
                              key={i}
                              className="h-3 w-3 fill-yellow-400 text-yellow-400"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  {visit.services_provided?.length > 0 && (
                    <div className="mb-2">
                      <p className="text-xs text-muted-foreground mb-1">
                        Services:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {visit.services_provided.map(
                          (service: string, index: number) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="text-xs"
                            >
                              {service}
                            </Badge>
                          ),
                        )}
                      </div>
                    </div>
                  )}
                  {visit.notes && (
                    <p className="text-sm text-muted-foreground">
                      {visit.notes}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No visit history found
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          {orders.length > 0 ? (
            orders.map((order) => (
              <Card key={order.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-medium">
                        Order #{order.order_number}
                      </span>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(order.created_at), "MMM dd, yyyy")}
                      </p>
                    </div>
                    <span className="font-semibold">${order.total}</span>
                  </div>
                  {order.order_items?.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-muted-foreground mb-1">
                        Items:
                      </p>
                      <div className="space-y-1">
                        {order.order_items.map((item: any) => (
                          <div
                            key={item.id}
                            className="flex justify-between text-sm"
                          >
                            <span>
                              {item.products?.name} x{item.quantity}
                            </span>
                            <span>${item.total_price}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No purchase history found
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="preferences" className="space-y-4">
          {preferences.length > 0 ? (
            preferences.map((pref) => (
              <Card key={pref.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium capitalize">
                        {pref.preference_category.replace("_", " ")}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {pref.preference_value}
                      </p>
                    </div>
                  </div>
                  {pref.notes && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {pref.notes}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No preferences recorded
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="communications" className="space-y-4">
          {communications.length > 0 ? (
            communications.map((comm) => (
              <Card key={comm.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <MessageCircle className="h-4 w-4" />
                      <Badge
                        variant={
                          comm.direction === "inbound" ? "default" : "secondary"
                        }
                      >
                        {comm.communication_type} - {comm.direction}
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(comm.sent_at), "MMM dd, yyyy")}
                    </span>
                  </div>
                  {comm.subject && (
                    <p className="font-medium mb-1">{comm.subject}</p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {comm.content}
                  </p>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No communications recorded
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
