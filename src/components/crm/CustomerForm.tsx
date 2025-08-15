import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { X, Upload, FileText } from "lucide-react";
import { SignatureCapture } from "./SignatureCapture";
import { useMutation, useQuery } from "@apollo/client";
import {
  CREATE_CUSTOMER,
  GET_CUSTOMER_BY_ID,
  Mutation,
  MutationCreateCustomerArgs,
  MutationUpdateCustomerArgs,
  Query,
  QueryGetCustomerByIdArgs,
  UPDATE_CUSTOMER,
} from "@/graphql";
import { showSuccess } from "@/hooks/useToastMessages.tsx";
import { uploadFileToS3 } from "@/lib/utils.ts";
import client from "@/graphql/client.ts";

interface CustomerFormProps {
  customerId?: string;
  onSave: () => void;
  onCancel: () => void;
}

export const CustomerForm = ({
  customerId,
  onSave,
  onCancel,
}: CustomerFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data } = useQuery<Query, QueryGetCustomerByIdArgs>(
    GET_CUSTOMER_BY_ID,
    {
      skip: !customerId,
      variables: {
        id: customerId,
      },
      fetchPolicy: "network-only",
    },
  );
  const [createCustomer, { loading: creating }] = useMutation<
    Mutation,
    MutationCreateCustomerArgs
  >(CREATE_CUSTOMER);
  const [updateCustomer, { loading: updating }] = useMutation<
    Mutation,
    MutationUpdateCustomerArgs
  >(UPDATE_CUSTOMER);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    date_of_birth: "",
    skin_type: "",
    notes: "",
    address_line_1: "",
    address_line_2: "",
    city: "",
    state_province: "",
    postal_code: "",
    country: "United States",
  });
  const [skinConcerns, setSkinConcerns] = useState<string[]>([]);
  const [newSkinConcern, setNewSkinConcern] = useState("");
  const [idDocument, setIdDocument] = useState<File | null>(null);
  const [idDocumentType, setIdDocumentType] = useState("");
  const [signatureDataUrl, setSignatureDataUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);

  const skinTypes = [
    "Normal",
    "Dry",
    "Oily",
    "Combination",
    "Sensitive",
    "Mature",
    "Acne-prone",
  ];

  const commonSkinConcerns = [
    "Acne",
    "Dark spots",
    "Fine lines",
    "Wrinkles",
    "Dryness",
    "Oiliness",
    "Sensitivity",
    "Rosacea",
    "Hyperpigmentation",
    "Large pores",
    "Blackheads",
    "Uneven texture",
  ];

  useEffect(() => {
    if (data?.getCustomerById) {
      setFormData({
        first_name: data?.getCustomerById.first_name || "",
        last_name: data?.getCustomerById.last_name || "",
        email: data?.getCustomerById.email || "",
        phone: data?.getCustomerById.phone || "",
        date_of_birth: data?.getCustomerById.date_of_birth
          ? data?.getCustomerById.date_of_birth.split("T")[0]
          : "",
        skin_type: data?.getCustomerById.skin_type || "",
        notes: data?.getCustomerById.notes || "",
        address_line_1: data?.getCustomerById.address_line_1 || "",
        address_line_2: data?.getCustomerById.address_line_2 || "",
        city: data?.getCustomerById.city || "",
        state_province: data?.getCustomerById.state_province || "",
        postal_code: data?.getCustomerById.postal_code || "",
        country: data?.getCustomerById.country || "United States",
      });

      setIdDocumentType(data?.getCustomerById.id_document_type || "");

      setSkinConcerns(data?.getCustomerById.skin_concerns || []);

      setSignatureDataUrl(data?.getCustomerById.signature_path ?? "");
    }
  }, [data?.getCustomerById]);

  const uploadFile = async (file: File, folder: string) => {
    const { publicUrl } = await uploadFileToS3(client, file, folder);

    return publicUrl;
  };

  const uploadSignature = async (dataUrl: string, customerId: string) => {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    const file = new File([blob], `signature-${customerId}.png`, {
      type: "image/png",
    });

    return uploadFile(file, `customer-signatures/${customerId}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // setLoading(true);
    setUploading(true);

    try {
      let idDocumentPath = null;
      let signaturePath = null;
      let currentCustomerId = customerId;

      if (!customerId) {
        const input = {
          ...formData,
          skin_concerns: skinConcerns,
          date_of_birth: formData.date_of_birth || null,
        };

        const res = await createCustomer({ variables: { input } });

        currentCustomerId = res.data.createCustomer.id;
      }

      if (idDocument && currentCustomerId) {
        idDocumentPath = await uploadFile(
          idDocument,
          "customer-documents",
          currentCustomerId,
        );
      }

      // Upload signature if provided
      if (signatureDataUrl && currentCustomerId) {
        signaturePath = await uploadSignature(
          signatureDataUrl,
          currentCustomerId,
        );
      }

      const customerData = {
        ...formData,
        skin_concerns: skinConcerns,
        date_of_birth: formData.date_of_birth || null,
        id_document_path: idDocumentPath,
        id_document_type: idDocumentType,
        signature_path: signaturePath,
        verification_date:
          idDocumentPath || signaturePath ? new Date().toISOString() : null,
        verified_by: idDocumentPath || signaturePath ? user?.id : null,
      };

      if (customerId) {
        await updateCustomer({
          variables: { input: { ...customerData, id: customerId } },
        });
        showSuccess("Customer updated successfully");
      } else {
        await updateCustomer({
          variables: {
            input: {
              id: currentCustomerId,
              id_document_path: idDocumentPath,
              id_document_type: idDocumentType,
              signature_path: signaturePath,
              verification_date:
                idDocumentPath || signaturePath
                  ? new Date().toISOString()
                  : null,
              verified_by: idDocumentPath || signaturePath ? user?.id : null,
            },
          },
        });

        showSuccess(
          "Customer created successfully with verification documents",
        );
      }

      onSave();
    } catch (error: any) {
      console.error("Error saving customer:", error);
    } finally {
      setUploading(false);
    }
  };

  const addSkinConcern = (concern: string) => {
    if (concern && !skinConcerns.includes(concern)) {
      setSkinConcerns([...skinConcerns, concern]);
      setNewSkinConcern("");
    }
  };

  const removeSkinConcern = (concern: string) => {
    setSkinConcerns(skinConcerns.filter((c) => c !== concern));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIdDocument(file);
    }
  };

  const handleSignatureSave = (dataUrl: string) => {
    setSignatureDataUrl(dataUrl);
    toast({
      title: "Signature Saved",
      description: "Customer signature has been captured",
    });
  };

  const idDocumentTypes = [
    "Driver's License",
    "Passport",
    "State ID",
    "Military ID",
    "Other Government ID",
  ];

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle>
          {customerId ? "Edit Customer" : "Add New Customer"}
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="flex items-center gap-2"
        >
          ← Back
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name *</Label>
              <Input
                id="first_name"
                required
                value={formData.first_name}
                onChange={(e) =>
                  setFormData({ ...formData, first_name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name *</Label>
              <Input
                id="last_name"
                required
                value={formData.last_name}
                onChange={(e) =>
                  setFormData({ ...formData, last_name: e.target.value })
                }
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Address Information</h3>
            <div className="space-y-2">
              <Label htmlFor="address_line_1">Address Line 1</Label>
              <Input
                id="address_line_1"
                placeholder="Street address"
                value={formData.address_line_1}
                onChange={(e) =>
                  setFormData({ ...formData, address_line_1: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address_line_2">Address Line 2 (Optional)</Label>
              <Input
                id="address_line_2"
                placeholder="Apartment, suite, etc."
                value={formData.address_line_2}
                onChange={(e) =>
                  setFormData({ ...formData, address_line_2: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state_province">State/Province</Label>
                <Input
                  id="state_province"
                  value={formData.state_province}
                  onChange={(e) =>
                    setFormData({ ...formData, state_province: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postal_code">Postal Code</Label>
                <Input
                  id="postal_code"
                  value={formData.postal_code}
                  onChange={(e) =>
                    setFormData({ ...formData, postal_code: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) =>
                  setFormData({ ...formData, country: e.target.value })
                }
              />
            </div>
          </div>

          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date_of_birth">Date of Birth</Label>
              <Input
                id="date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={(e) =>
                  setFormData({ ...formData, date_of_birth: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="skin_type">Skin Type</Label>
              <Select
                value={formData.skin_type}
                onValueChange={(value) =>
                  setFormData({ ...formData, skin_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select skin type" />
                </SelectTrigger>
                <SelectContent>
                  {skinTypes.map((type) => (
                    <SelectItem key={type} value={type.toLowerCase()}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Skin Concerns */}
          <div className="space-y-2">
            <Label>Skin Concerns</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {skinConcerns.map((concern) => (
                <Badge
                  key={concern}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {concern}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => removeSkinConcern(concern)}
                  />
                </Badge>
              ))}
            </div>
            <div className="flex gap-2 mb-2">
              <Input
                placeholder="Add skin concern"
                value={newSkinConcern}
                onChange={(e) => setNewSkinConcern(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSkinConcern(newSkinConcern);
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => addSkinConcern(newSkinConcern)}
              >
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {commonSkinConcerns
                .filter((concern) => !skinConcerns.includes(concern))
                .map((concern) => (
                  <Button
                    key={concern}
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={() => addSkinConcern(concern)}
                  >
                    + {concern}
                  </Button>
                ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              rows={3}
              placeholder="Any additional notes about the customer..."
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
            />
          </div>

          {/* ID Document Upload */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Verification Documents</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="id_document_type">ID Document Type</Label>
                <Select
                  value={idDocumentType}
                  onValueChange={setIdDocumentType}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select ID type" />
                  </SelectTrigger>
                  <SelectContent>
                    {idDocumentTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="id_document">Upload ID Document</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="id_document"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileUpload}
                    className="flex-1"
                  />
                  {idDocument && (
                    <div className="flex items-center text-sm text-green-600">
                      <FileText className="h-4 w-4 mr-1" />
                      {idDocument.name}
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Upload a clear photo or scan of government-issued ID for
                  verification
                </p>
              </div>
            </div>
          </div>

          {/* Signature Capture */}
          <SignatureCapture
            onSignatureSave={handleSignatureSave}
            existingSignature={signatureDataUrl}
            disabled={!!signatureDataUrl && !!customerId}
          />

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={creating || updating || uploading}
            >
              Cancel
            </Button>
            <Button type="submit" loading={creating || updating || uploading}>
              {customerId ? "Update Customer" : "Create Customer"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
