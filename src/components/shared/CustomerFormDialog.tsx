import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { X, Upload, FileText } from "lucide-react";
import { SignatureCapture } from "../crm/SignatureCapture";

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  loyalty_points: number;
  address_line_1?: string;
  city?: string;
  state_province?: string;
  postal_code?: string;
  date_of_birth?: string;
  skin_type?: string;
  notes?: string;
  address_line_2?: string;
  country?: string;
  skin_concerns?: string[];
}

interface CustomerFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCustomerCreated: (customer: Customer) => void;
  businessId: string;
  requiresShipping?: boolean;
  simplified?: boolean; // For POS quick customer creation
}

export const CustomerFormDialog = ({ 
  isOpen, 
  onClose, 
  onCustomerCreated, 
  businessId, 
  requiresShipping = false,
  simplified = false 
}: CustomerFormDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    skin_type: '',
    notes: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    state_province: '',
    postal_code: '',
    country: 'United States',
  });
  const [skinConcerns, setSkinConcerns] = useState<string[]>([]);
  const [newSkinConcern, setNewSkinConcern] = useState('');
  const [idDocument, setIdDocument] = useState<File | null>(null);
  const [idDocumentType, setIdDocumentType] = useState('');
  const [signatureDataUrl, setSignatureDataUrl] = useState<string>('');
  const [uploading, setUploading] = useState(false);

  const skinTypes = [
    'Normal',
    'Dry',
    'Oily',
    'Combination',
    'Sensitive',
    'Mature',
    'Acne-prone'
  ];

  const commonSkinConcerns = [
    'Acne',
    'Dark spots',
    'Fine lines',
    'Wrinkles',
    'Dryness',
    'Oiliness',
    'Sensitivity',
    'Rosacea',
    'Hyperpigmentation',
    'Large pores',
    'Blackheads',
    'Uneven texture'
  ];

  const idDocumentTypes = [
    'Driver\'s License',
    'Passport',
    'State ID',
    'Military ID',
    'Other Government ID'
  ];

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      date_of_birth: '',
      skin_type: '',
      notes: '',
      address_line_1: '',
      address_line_2: '',
      city: '',
      state_province: '',
      postal_code: '',
      country: 'United States',
    });
    setSkinConcerns([]);
    setNewSkinConcern('');
    setIdDocument(null);
    setIdDocumentType('');
    setSignatureDataUrl('');
  };

  const uploadFile = async (file: File, bucket: string, folder: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);

    if (uploadError) throw uploadError;
    return filePath;
  };

  const uploadSignature = async (dataUrl: string, customerId: string) => {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    const file = new File([blob], `signature-${customerId}.png`, { type: 'image/png' });
    return uploadFile(file, 'customer-signatures', customerId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setUploading(true);

    try {
      // Basic validation
      if (!formData.first_name || !formData.last_name || !formData.phone) {
        throw new Error("Please fill in first name, last name, and phone number");
      }

      // Additional validation for shipping requirements
      if (requiresShipping && (!formData.address_line_1 || !formData.city || !formData.state_province || !formData.postal_code)) {
        throw new Error("Complete address is required for shipping items");
      }

      // Create customer first
      const newCustomerData = {
        ...formData,
        skin_concerns: skinConcerns,
        business_id: businessId,
        date_of_birth: formData.date_of_birth || null,
        loyalty_points: 0
      };

      const { data: newCustomer, error: createError } = await supabase
        .from('customers')
        .insert([newCustomerData])
        .select()
        .single();

      if (createError) throw createError;

      let idDocumentPath = null;
      let signaturePath = null;

      // Upload files if not simplified mode
      if (!simplified) {
        // Upload ID document if provided
        if (idDocument) {
          idDocumentPath = await uploadFile(idDocument, 'customer-documents', newCustomer.id);
        }

        // Upload signature if provided
        if (signatureDataUrl) {
          signaturePath = await uploadSignature(signatureDataUrl, newCustomer.id);
        }

        // Update customer with file paths if any files were uploaded
        if (idDocumentPath || signaturePath) {
          const { error: updateError } = await supabase
            .from('customers')
            .update({
              id_document_path: idDocumentPath,
              id_document_type: idDocumentType,
              signature_path: signaturePath,
              verification_date: new Date().toISOString(),
              verified_by: user?.id,
            })
            .eq('id', newCustomer.id);

          if (updateError) throw updateError;
        }
      }

      toast({
        title: "Success",
        description: "Customer created successfully",
      });

      onCustomerCreated(newCustomer);
      resetForm();
      onClose();

    } catch (error: any) {
      console.error('Error creating customer:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create customer",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const addSkinConcern = (concern: string) => {
    if (concern && !skinConcerns.includes(concern)) {
      setSkinConcerns([...skinConcerns, concern]);
      setNewSkinConcern('');
    }
  };

  const removeSkinConcern = (concern: string) => {
    setSkinConcerns(skinConcerns.filter(c => c !== concern));
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Add New Customer</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name *</Label>
              <Input
                id="first_name"
                required
                value={formData.first_name}
                onChange={(e) => setFormData({...formData, first_name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name *</Label>
              <Input
                id="last_name"
                required
                value={formData.last_name}
                onChange={(e) => setFormData({...formData, last_name: e.target.value})}
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
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>
          </div>

          {/* Address Information - Required for shipping */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">Address Information</h3>
              {requiresShipping && (
                <Badge variant="outline" className="text-xs">
                  Required for shipping
                </Badge>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address_line_1">
                Address Line 1 {requiresShipping && "*"}
              </Label>
              <Input
                id="address_line_1"
                placeholder="Street address"
                required={requiresShipping}
                value={formData.address_line_1}
                onChange={(e) => setFormData({...formData, address_line_1: e.target.value})}
              />
            </div>
            
            {!simplified && (
              <div className="space-y-2">
                <Label htmlFor="address_line_2">Address Line 2 (Optional)</Label>
                <Input
                  id="address_line_2"
                  placeholder="Apartment, suite, etc."
                  value={formData.address_line_2}
                  onChange={(e) => setFormData({...formData, address_line_2: e.target.value})}
                />
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">
                  City {requiresShipping && "*"}
                </Label>
                <Input
                  id="city"
                  required={requiresShipping}
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state_province">
                  State {requiresShipping && "*"}
                </Label>
                <Input
                  id="state_province"
                  required={requiresShipping}
                  value={formData.state_province}
                  onChange={(e) => setFormData({...formData, state_province: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postal_code">
                  ZIP Code {requiresShipping && "*"}
                </Label>
                <Input
                  id="postal_code"
                  required={requiresShipping}
                  value={formData.postal_code}
                  onChange={(e) => setFormData({...formData, postal_code: e.target.value})}
                />
              </div>
            </div>
            
            {!simplified && (
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => setFormData({...formData, country: e.target.value})}
                />
              </div>
            )}
          </div>

          {/* Additional Information - Only for full CRM mode */}
          {!simplified && (
            <>
              {/* Personal Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date_of_birth">Date of Birth</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="skin_type">Skin Type</Label>
                  <Select
                    value={formData.skin_type}
                    onValueChange={(value) => setFormData({...formData, skin_type: value})}
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
                    <Badge key={concern} variant="secondary" className="flex items-center gap-1">
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
                      if (e.key === 'Enter') {
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
                    .filter(concern => !skinConcerns.includes(concern))
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

              {/* ID Document Upload */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Verification Documents (Optional)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="id_document_type">ID Document Type</Label>
                    <Select
                      value={idDocumentType}
                      onValueChange={setIdDocumentType}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select document type" />
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
                    <div className="flex items-center gap-2">
                      <Input
                        id="id_document"
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleFileUpload}
                        className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/80"
                      />
                      {idDocument && (
                        <div className="flex items-center gap-1 text-sm text-green-600">
                          <FileText className="h-4 w-4" />
                          <span>{idDocument.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Signature Capture */}
                <div className="space-y-2">
                  <Label>Customer Signature</Label>
                  <SignatureCapture 
                    onSignatureSave={handleSignatureSave}
                    existingSignature={signatureDataUrl}
                  />
                </div>
              </div>
            </>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              rows={3}
              placeholder="Any additional notes about the customer..."
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-2 pt-4">
            <Button 
              type="submit" 
              disabled={loading || uploading}
              className="flex-1"
            >
              {loading || uploading ? 'Creating...' : 'Create Customer'}
            </Button>
            <Button 
              type="button"
              variant="outline" 
              onClick={onClose}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};