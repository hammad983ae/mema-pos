interface PaymentGateway {
  id: string;
  name: string;
  type: 'primary' | 'secondary' | 'backup';
  status: 'online' | 'offline' | 'error';
  priority: number;
  maxRetries: number;
  timeout: number;
}

interface PaymentRequest {
  amount: number;
  method: 'card' | 'cash' | 'digital_wallet' | 'gift_card' | 'check';
  cardType?: string;
  customerData?: any;
  metadata?: any;
}

interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  referenceNumber?: string;
  gateway?: string;
  errorMessage?: string;
  processingTime: number;
  retryCount?: number;
  fallbackUsed?: boolean;
}

class PaymentProcessorService {
  private gateways: PaymentGateway[] = [
    {
      id: 'stripe_terminal',
      name: 'Stripe Terminal',
      type: 'primary',
      status: 'online',
      priority: 1,
      maxRetries: 3,
      timeout: 30000
    },
    {
      id: 'square_pos',
      name: 'Square POS',
      type: 'secondary',
      status: 'online',
      priority: 2,
      maxRetries: 2,
      timeout: 25000
    },
    {
      id: 'paypal_zettle',
      name: 'PayPal Zettle',
      type: 'backup',
      status: 'online',
      priority: 3,
      maxRetries: 2,
      timeout: 20000
    }
  ];

  private failureThreshold = 3;
  private circuitBreakerTimeout = 300000; // 5 minutes
  private gatewayFailures: Map<string, { count: number; lastFailure: number }> = new Map();

  /**
   * Process a payment with automatic failover and retry logic
   */
  async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
    const startTime = Date.now();
    const availableGateways = this.getAvailableGateways();

    if (availableGateways.length === 0) {
      return {
        success: false,
        errorMessage: 'No payment gateways available',
        processingTime: Date.now() - startTime
      };
    }

    let lastError: string = '';
    let totalRetries = 0;

    for (const gateway of availableGateways) {
      if (this.isGatewayCircuitOpen(gateway.id)) {
        console.log(`Gateway ${gateway.id} circuit is open, skipping...`);
        continue;
      }

      const retries = gateway.maxRetries;
      
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          console.log(`Attempting payment on ${gateway.id}, attempt ${attempt + 1}`);
          
          const response = await this.attemptPayment(gateway, request);
          
          if (response.success) {
            // Reset failure count on successful payment
            this.gatewayFailures.delete(gateway.id);
            
            return {
              ...response,
              gateway: gateway.id,
              processingTime: Date.now() - startTime,
              retryCount: totalRetries,
              fallbackUsed: gateway.type !== 'primary'
            };
          }

          lastError = response.errorMessage || 'Payment failed';
          totalRetries++;

          // Wait before retry (exponential backoff)
          if (attempt < retries) {
            await this.delay(Math.pow(2, attempt) * 1000);
          }

        } catch (error) {
          lastError = error instanceof Error ? error.message : 'Unknown error';
          totalRetries++;

          // Record gateway failure
          this.recordGatewayFailure(gateway.id);

          if (attempt < retries) {
            await this.delay(Math.pow(2, attempt) * 1000);
          }
        }
      }

      // If all retries failed for this gateway, mark it as temporarily unavailable
      this.updateGatewayStatus(gateway.id, 'error');
    }

    return {
      success: false,
      errorMessage: `All payment gateways failed. Last error: ${lastError}`,
      processingTime: Date.now() - startTime,
      retryCount: totalRetries
    };
  }

  /**
   * Process multiple payments (for split tender)
   */
  async processMultiplePayments(requests: PaymentRequest[]): Promise<PaymentResponse[]> {
    const responses: PaymentResponse[] = [];
    
    // Process payments sequentially to avoid overwhelming gateways
    for (const request of requests) {
      const response = await this.processPayment(request);
      responses.push(response);
      
      // If a payment fails and we don't allow partial approvals, stop
      if (!response.success) {
        console.warn(`Payment failed: ${response.errorMessage}`);
      }
    }

    return responses;
  }

  /**
   * Test gateway connectivity
   */
  async testGateway(gatewayId: string): Promise<{ success: boolean; responseTime: number; error?: string }> {
    const gateway = this.gateways.find(g => g.id === gatewayId);
    if (!gateway) {
      return { success: false, responseTime: 0, error: 'Gateway not found' };
    }

    const startTime = Date.now();
    
    try {
      // Simulate connection test
      const response = await this.simulateGatewayTest(gateway);
      const responseTime = Date.now() - startTime;

      if (response.success) {
        this.updateGatewayStatus(gatewayId, 'online');
        this.gatewayFailures.delete(gatewayId);
      } else {
        this.updateGatewayStatus(gatewayId, 'error');
      }

      return {
        success: response.success,
        responseTime,
        error: response.error
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.updateGatewayStatus(gatewayId, 'error');
      
      return {
        success: false,
        responseTime,
        error: error instanceof Error ? error.message : 'Connection failed'
      };
    }
  }

  /**
   * Get available gateways sorted by priority
   */
  private getAvailableGateways(): PaymentGateway[] {
    return this.gateways
      .filter(gateway => gateway.status === 'online')
      .sort((a, b) => a.priority - b.priority);
  }

  /**
   * Attempt payment on a specific gateway
   */
  private async attemptPayment(gateway: PaymentGateway, request: PaymentRequest): Promise<PaymentResponse> {
    const startTime = Date.now();

    // Simulate different gateway behaviors
    const response = await this.simulatePaymentGateway(gateway, request);
    
    return {
      ...response,
      processingTime: Date.now() - startTime
    };
  }

  /**
   * Simulate payment gateway processing
   */
  private async simulatePaymentGateway(gateway: PaymentGateway, request: PaymentRequest): Promise<PaymentResponse> {
    // Simulate network delay
    await this.delay(Math.random() * 2000 + 500);

    // Simulate different success rates for different gateways
    const successRates = {
      stripe_terminal: 0.95,
      square_pos: 0.92,
      paypal_zettle: 0.88
    };

    const successRate = successRates[gateway.id as keyof typeof successRates] || 0.90;
    const isSuccess = Math.random() < successRate;

    if (isSuccess) {
      return {
        success: true,
        transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        referenceNumber: `REF${Date.now()}${Math.floor(Math.random() * 1000)}`,
        processingTime: 0 // Will be set by caller
      };
    } else {
      // Simulate different error types
      const errors = [
        'Card declined - insufficient funds',
        'Card declined - invalid card number',
        'Transaction timeout',
        'Gateway temporarily unavailable',
        'Invalid merchant configuration'
      ];
      
      throw new Error(errors[Math.floor(Math.random() * errors.length)]);
    }
  }

  /**
   * Simulate gateway connectivity test
   */
  private async simulateGatewayTest(gateway: PaymentGateway): Promise<{ success: boolean; error?: string }> {
    await this.delay(Math.random() * 1000 + 200);

    // Simulate occasional connectivity issues
    const isOnline = Math.random() > 0.1; // 90% uptime

    if (isOnline) {
      return { success: true };
    } else {
      return { 
        success: false, 
        error: `Unable to connect to ${gateway.name}` 
      };
    }
  }

  /**
   * Record a gateway failure for circuit breaker pattern
   */
  private recordGatewayFailure(gatewayId: string): void {
    const current = this.gatewayFailures.get(gatewayId) || { count: 0, lastFailure: 0 };
    this.gatewayFailures.set(gatewayId, {
      count: current.count + 1,
      lastFailure: Date.now()
    });

    // If failure threshold exceeded, open circuit breaker
    if (current.count + 1 >= this.failureThreshold) {
      console.warn(`Gateway ${gatewayId} circuit breaker opened due to ${current.count + 1} failures`);
      this.updateGatewayStatus(gatewayId, 'error');
    }
  }

  /**
   * Check if gateway circuit breaker is open
   */
  private isGatewayCircuitOpen(gatewayId: string): boolean {
    const failure = this.gatewayFailures.get(gatewayId);
    if (!failure || failure.count < this.failureThreshold) {
      return false;
    }

    // Check if circuit breaker timeout has passed
    const timeSinceLastFailure = Date.now() - failure.lastFailure;
    if (timeSinceLastFailure > this.circuitBreakerTimeout) {
      // Reset the circuit breaker
      this.gatewayFailures.delete(gatewayId);
      this.updateGatewayStatus(gatewayId, 'online');
      return false;
    }

    return true;
  }

  /**
   * Update gateway status
   */
  private updateGatewayStatus(gatewayId: string, status: PaymentGateway['status']): void {
    const gateway = this.gateways.find(g => g.id === gatewayId);
    if (gateway) {
      gateway.status = status;
      console.log(`Gateway ${gatewayId} status updated to: ${status}`);
    }
  }

  /**
   * Utility function for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current gateway statuses
   */
  getGatewayStatuses(): PaymentGateway[] {
    return [...this.gateways];
  }

  /**
   * Get gateway health metrics
   */
  getHealthMetrics() {
    return {
      gateways: this.gateways.map(gateway => ({
        id: gateway.id,
        name: gateway.name,
        status: gateway.status,
        failureCount: this.gatewayFailures.get(gateway.id)?.count || 0,
        lastFailure: this.gatewayFailures.get(gateway.id)?.lastFailure,
        circuitOpen: this.isGatewayCircuitOpen(gateway.id)
      })),
      totalFailures: Array.from(this.gatewayFailures.values()).reduce((sum, f) => sum + f.count, 0)
    };
  }

  /**
   * Force gateway status (for testing/admin purposes)
   */
  setGatewayStatus(gatewayId: string, status: PaymentGateway['status']): boolean {
    const gateway = this.gateways.find(g => g.id === gatewayId);
    if (gateway) {
      gateway.status = status;
      
      // Clear failure count if setting to online
      if (status === 'online') {
        this.gatewayFailures.delete(gatewayId);
      }
      
      return true;
    }
    return false;
  }
}

// Export singleton instance
export const paymentProcessor = new PaymentProcessorService();
export type { PaymentRequest, PaymentResponse, PaymentGateway };