import { useState, useCallback } from 'react';
import { sanitizeText, sanitizePin, sanitizeEmail, sanitizeUsername, sanitizeAmount, sanitizePhone } from '@/utils/sanitizer';

export interface ValidationRules {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  type?: 'text' | 'email' | 'pin' | 'username' | 'amount' | 'phone';
}

export interface ValidationResult {
  isValid: boolean;
  error: string | null;
}

export const useSecureInput = () => {
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const sanitizeInput = useCallback((value: string, type: ValidationRules['type'] = 'text'): string => {
    switch (type) {
      case 'email':
        return sanitizeEmail(value);
      case 'pin':
        return sanitizePin(value);
      case 'username':
        return sanitizeUsername(value);
      case 'amount':
        return sanitizeAmount(value);
      case 'phone':
        return sanitizePhone(value);
      default:
        return sanitizeText(value);
    }
  }, []);

  const validateInput = useCallback((
    value: string, 
    rules: ValidationRules,
    fieldName: string
  ): ValidationResult => {
    const sanitizedValue = sanitizeInput(value, rules.type);
    
    // Required validation
    if (rules.required && !sanitizedValue.trim()) {
      return { isValid: false, error: `${fieldName} is required` };
    }

    // Length validations
    if (rules.minLength && sanitizedValue.length < rules.minLength) {
      return { 
        isValid: false, 
        error: `${fieldName} must be at least ${rules.minLength} characters` 
      };
    }

    if (rules.maxLength && sanitizedValue.length > rules.maxLength) {
      return { 
        isValid: false, 
        error: `${fieldName} must not exceed ${rules.maxLength} characters` 
      };
    }

    // Pattern validation
    if (rules.pattern && !rules.pattern.test(sanitizedValue)) {
      return { 
        isValid: false, 
        error: `${fieldName} format is invalid` 
      };
    }

    // Type-specific validations
    if (rules.type === 'email') {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(sanitizedValue)) {
        return { isValid: false, error: 'Please enter a valid email address' };
      }
    }

    if (rules.type === 'pin') {
      if (!/^\d{6}$/.test(sanitizedValue)) {
        return { isValid: false, error: 'PIN must be exactly 6 digits' };
      }
    }

    return { isValid: true, error: null };
  }, [sanitizeInput]);

  const setError = useCallback((fieldName: string, error: string) => {
    setValidationErrors(prev => ({ ...prev, [fieldName]: error }));
  }, []);

  const clearError = useCallback((fieldName: string) => {
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setValidationErrors({});
  }, []);

  return {
    sanitizeInput,
    validateInput,
    validationErrors,
    setError,
    clearError,
    clearAllErrors,
  };
};