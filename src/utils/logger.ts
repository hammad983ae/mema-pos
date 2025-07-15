/**
 * Secure logging utility that prevents sensitive information exposure in production
 */

const isDevelopment = import.meta.env.MODE === 'development';

interface LogOptions {
  skipInProduction?: boolean;
  sanitize?: boolean;
}

/**
 * Sanitizes sensitive data from log messages
 */
const sanitizeLogData = (data: any): any => {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const sensitiveKeys = ['password', 'pin', 'token', 'secret', 'key', 'auth', 'credential'];
  const sanitized = { ...data };

  for (const key in sanitized) {
    if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeLogData(sanitized[key]);
    }
  }

  return sanitized;
};

/**
 * Secure console.log replacement
 */
export const secureLog = (message: string, data?: any, options: LogOptions = {}) => {
  if (!isDevelopment && options.skipInProduction !== false) {
    return; // Don't log in production unless explicitly allowed
  }

  const logData = options.sanitize !== false ? sanitizeLogData(data) : data;
  
  if (isDevelopment) {
    console.log(`[SECURE] ${message}`, logData);
  }
};

/**
 * Secure error logging
 */
export const secureError = (message: string, error?: any, options: LogOptions = {}) => {
  const logData = options.sanitize !== false ? sanitizeLogData(error) : error;
  
  if (isDevelopment) {
    console.error(`[SECURE ERROR] ${message}`, logData);
  } else {
    // In production, only log essential error info without sensitive data
    console.error(`[ERROR] ${message}`);
  }
};

/**
 * Secure warning logging
 */
export const secureWarn = (message: string, data?: any, options: LogOptions = {}) => {
  if (!isDevelopment && options.skipInProduction !== false) {
    return;
  }

  const logData = options.sanitize !== false ? sanitizeLogData(data) : data;
  
  if (isDevelopment) {
    console.warn(`[SECURE WARN] ${message}`, logData);
  }
};