import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Receipt, Mail, Printer, Copy } from "lucide-react";

export type ReceiptPreference = 'none' | 'print' | 'email' | 'both';

interface ReceiptPreferenceSelectorProps {
  preference: ReceiptPreference;
  onPreferenceChange: (preference: ReceiptPreference) => void;
  customerEmail: string;
  onEmailChange: (email: string) => void;
  disabled?: boolean;
}

export const ReceiptPreferenceSelector = ({
  preference,
  onPreferenceChange,
  customerEmail,
  onEmailChange,
  disabled = false
}: ReceiptPreferenceSelectorProps) => {
  const [emailValid, setEmailValid] = useState(true);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (value: string) => {
    onEmailChange(value);
    setEmailValid(value === '' || validateEmail(value));
  };

  const receiptOptions = [
    {
      value: 'none' as ReceiptPreference,
      label: 'No Receipt',
      description: 'Skip receipt',
      icon: Receipt,
      color: 'text-gray-500'
    },
    {
      value: 'print' as ReceiptPreference,
      label: 'Printed Receipt',
      description: 'Physical receipt only',
      icon: Printer,
      color: 'text-blue-600'
    },
    {
      value: 'email' as ReceiptPreference,
      label: 'Email Receipt',
      description: 'Digital receipt via email',
      icon: Mail,
      color: 'text-green-600'
    },
    {
      value: 'both' as ReceiptPreference,
      label: 'Both',
      description: 'Printed + email receipt',
      icon: Copy,
      color: 'text-purple-600'
    }
  ];

  const needsEmail = preference === 'email' || preference === 'both';

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Receipt className="h-5 w-5" />
          Receipt Preference
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <RadioGroup
          value={preference}
          onValueChange={(value) => onPreferenceChange(value as ReceiptPreference)}
          disabled={disabled}
          className="grid grid-cols-2 gap-3"
        >
          {receiptOptions.map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <RadioGroupItem 
                value={option.value} 
                id={option.value}
                className="peer sr-only"
              />
              <Label
                htmlFor={option.value}
                className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 border-muted cursor-pointer transition-all hover:border-primary/50 peer-checked:border-primary peer-checked:bg-primary/5 ${
                  disabled ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <option.icon className={`h-6 w-6 ${option.color}`} />
                <div className="text-center">
                  <div className="font-medium text-sm">{option.label}</div>
                  <div className="text-xs text-muted-foreground">{option.description}</div>
                </div>
              </Label>
            </div>
          ))}
        </RadioGroup>

        {needsEmail && (
          <div className="space-y-2 pt-2 border-t">
            <Label htmlFor="receipt-email" className="text-sm font-medium">
              Email Address <span className="text-red-500">*</span>
            </Label>
            <Input
              id="receipt-email"
              type="email"
              placeholder="customer@example.com"
              value={customerEmail}
              onChange={(e) => handleEmailChange(e.target.value)}
              disabled={disabled}
              className={`${!emailValid ? 'border-red-500 focus:border-red-500' : ''}`}
            />
            {needsEmail && customerEmail && !emailValid && (
              <p className="text-sm text-red-500">Please enter a valid email address</p>
            )}
            {needsEmail && !customerEmail && (
              <p className="text-sm text-muted-foreground">Email address is required for email receipts</p>
            )}
          </div>
        )}

        {preference === 'print' && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              📄 Receipt will be printed automatically after payment
            </p>
          </div>
        )}

        {preference === 'email' && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700">
              📧 Receipt will be sent to the provided email address
            </p>
          </div>
        )}

        {preference === 'both' && (
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <p className="text-sm text-purple-700">
              📄📧 Receipt will be printed and emailed
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};