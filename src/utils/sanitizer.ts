import DOMPurify from 'dompurify';

/**
 * Sanitizes HTML content to prevent XSS attacks
 */
export const sanitizeHtml = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'u', 'br', 'p'],
    ALLOWED_ATTR: [],
  });
};

/**
 * Sanitizes text input by removing potentially dangerous characters
 */
export const sanitizeText = (text: string): string => {
  return text
    .replace(/<[^>]*>?/gm, '') // Remove HTML tags
    .replace(/[<>'"]/g, '') // Remove potentially dangerous characters
    .trim();
};

/**
 * Validates and sanitizes PIN input
 */
export const sanitizePin = (pin: string): string => {
  return pin.replace(/\D/g, ''); // Only allow digits
};

/**
 * Validates and sanitizes email input
 */
export const sanitizeEmail = (email: string): string => {
  return email
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9@._-]/g, ''); // Only allow email-safe characters
};

/**
 * Validates and sanitizes username input
 */
export const sanitizeUsername = (username: string): string => {
  return username
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_-]/g, ''); // Only allow alphanumeric, underscore, and dash
};

/**
 * Validates monetary amounts to prevent injection
 */
export const sanitizeAmount = (amount: string): string => {
  return amount.replace(/[^0-9.]/g, ''); // Only allow digits and decimal point
};

/**
 * Validates phone numbers
 */
export const sanitizePhone = (phone: string): string => {
  return phone.replace(/[^0-9+()-\s]/g, ''); // Only allow phone number characters
};