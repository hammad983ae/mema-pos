import bcrypt from 'bcryptjs';
import DOMPurify from 'dompurify';
import { supabase } from '@/integrations/supabase/client';

// PIN Security Functions
export const hashPin = async (pin: string): Promise<string> => {
  const saltRounds = 12;
  return bcrypt.hash(pin, saltRounds);
};

export const verifyPin = async (pin: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(pin, hash);
};

export const checkPinRateLimit = async (userId: string): Promise<boolean> => {
  const { data, error } = await supabase.rpc('check_pin_rate_limit', {
    p_user_id: userId
  });
  
  if (error) {
    console.error('Rate limit check failed:', error);
    return false;
  }
  
  return data;
};

export const logPinAttempt = async (
  userId: string, 
  success: boolean, 
  ipAddress?: string, 
  userAgent?: string
): Promise<void> => {
  const { error } = await supabase.rpc('log_pin_attempt', {
    p_user_id: userId,
    p_success: success,
    p_ip_address: ipAddress || null,
    p_user_agent: userAgent || null
  });
  
  if (error) {
    console.error('Failed to log PIN attempt:', error);
  }
};

// Session Management
export const createUserSession = async (
  userId: string,
  businessId: string,
  sessionToken: string,
  expiresAt: Date
): Promise<void> => {
  const { error } = await supabase
    .from('user_sessions')
    .insert({
      user_id: userId,
      business_id: businessId,
      session_token: sessionToken,
      expires_at: expiresAt.toISOString(),
      ip_address: await getClientIP(),
      user_agent: navigator.userAgent
    });
    
  if (error) {
    console.error('Failed to create session:', error);
    throw error;
  }
};

export const invalidateUserSession = async (sessionToken: string): Promise<void> => {
  const { error } = await supabase
    .from('user_sessions')
    .update({ is_active: false })
    .eq('session_token', sessionToken);
    
  if (error) {
    console.error('Failed to invalidate session:', error);
  }
};

export const cleanupExpiredSessions = async (): Promise<void> => {
  const { error } = await supabase
    .from('user_sessions')
    .update({ is_active: false })
    .lt('expires_at', new Date().toISOString());
    
  if (error) {
    console.error('Failed to cleanup expired sessions:', error);
  }
};

// Security Event Logging
export const logSecurityEvent = async (
  businessId: string,
  eventType: string,
  eventDescription: string,
  severity: 'info' | 'warning' | 'critical' = 'info',
  additionalData?: Record<string, any>
): Promise<void> => {
  const { error } = await supabase
    .from('security_events')
    .insert({
      business_id: businessId,
      event_type: eventType,
      event_description: eventDescription,
      severity,
      ip_address: await getClientIP(),
      user_agent: navigator.userAgent,
      additional_data: additionalData || {}
    });
    
  if (error) {
    console.error('Failed to log security event:', error);
  }
};

// Input Sanitization
export const sanitizeInput = (input: string): string => {
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
};

export const sanitizeHTML = (html: string): string => {
  return DOMPurify.sanitize(html);
};

// Utility Functions
const getClientIP = async (): Promise<string | null> => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.warn('Failed to get client IP:', error);
    return null;
  }
};

export const generateSecureToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

export const validatePinFormat = (pin: string): boolean => {
  // PIN should be exactly 6 digits
  return /^\d{6}$/.test(pin);
};