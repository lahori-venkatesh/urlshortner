import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

export interface PaymentRequest {
  planType: 'MONTHLY' | 'YEARLY' | 'LIFETIME';
  email: string;
  name: string;
  phone: string;
}

export interface PaymentResponse {
  orderId: string;
  razorpayKeyId: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  email: string;
  phone: string;
  callbackUrl: string;
}

export interface SubscriptionStatus {
  hasActiveSubscription: boolean;
  planType?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  isExpired?: boolean;
}

export interface Plan {
  name: string;
  price: number;
  currency: string;
  discount?: string;
  features: string[];
}

class PaymentService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  async createPaymentOrder(paymentRequest: PaymentRequest): Promise<PaymentResponse> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/payment/create-order`,
        paymentRequest,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to create payment order');
    }
  }

  async verifyPayment(paymentData: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }): Promise<{ success: boolean; message: string }> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/payment/verify`,
        paymentData,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Payment verification failed');
    }
  }

  async getSubscriptionStatus(): Promise<SubscriptionStatus> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/payment/subscription/status`,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to get subscription status');
    }
  }

  async getAvailablePlans(): Promise<{ plans: Record<string, Plan> }> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/payment/plans`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to get plans');
    }
  }

  // Razorpay payment integration
  async initiateRazorpayPayment(paymentResponse: PaymentResponse): Promise<void> {
    return new Promise((resolve, reject) => {
      // Load Razorpay script if not already loaded
      if (!window.Razorpay) {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => this.openRazorpayCheckout(paymentResponse, resolve, reject);
        script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
        document.body.appendChild(script);
      } else {
        this.openRazorpayCheckout(paymentResponse, resolve, reject);
      }
    });
  }

  private openRazorpayCheckout(
    paymentResponse: PaymentResponse,
    resolve: () => void,
    reject: (error: Error) => void
  ) {
    const options = {
      key: paymentResponse.razorpayKeyId,
      amount: paymentResponse.amount * 100, // Convert to paise
      currency: paymentResponse.currency,
      name: 'Pebly Premium',
      description: paymentResponse.description,
      order_id: paymentResponse.orderId,
      prefill: {
        name: paymentResponse.name,
        email: paymentResponse.email,
        contact: paymentResponse.phone
      },
      theme: {
        color: '#2563eb'
      },
      handler: async (response: any) => {
        try {
          await this.verifyPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature
          });
          resolve();
        } catch (error) {
          reject(error as Error);
        }
      },
      modal: {
        ondismiss: () => {
          reject(new Error('Payment cancelled by user'));
        }
      }
    };

    const razorpay = new window.Razorpay(options);
    razorpay.open();
  }
}

// Extend Window interface for Razorpay
declare global {
  interface Window {
    Razorpay: any;
  }
}

export const paymentService = new PaymentService();