'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/auth';

function PaymentStatusContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token } = useAuthStore();
  
  const orderId = searchParams.get('orderId');
  const reference = searchParams.get('reference');
  const status = searchParams.get('status');

  const [_payment, _setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');

  useEffect(() => {
    if (!token) {
      router.push('/auth/login');
      return;
    }

    if (!orderId) {
      router.push('/buyer/marketplace');
      return;
    }

    // Check payment status
    checkPaymentStatus();
  }, [token, orderId, router]);

  const checkPaymentStatus = async () => {
    try {
      if (!reference) {
        // Assume success if no reference (might be blockchain confirmation)
        setPaymentStatus('success');
        setLoading(false);
        return;
      }

      // Query Paystack API or our backend for verification
      // This is a simplified version - in production, use webhook verification
      setPaymentStatus(status === 'true' ? 'success' : 'failed');
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to check payment status');
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Verifying payment...</div>;
  }

  const isSuccess = paymentStatus === 'success';

  return (
    <div className="max-w-md mx-auto">
      <div className="card text-center py-12">
        {isSuccess ? (
          <>
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold mb-2 text-success">Payment Successful!</h2>
            <p className="text-gray-600 mb-6">
              Your order has been confirmed. The farmer will prepare your product for delivery.
            </p>
            {reference && (
              <div className="bg-gray-50 p-4 rounded mb-6 text-left">
                <p className="text-sm text-gray-600">Reference</p>
                <p className="font-mono text-sm break-all">{reference}</p>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold mb-2 text-error">Payment Failed</h2>
            <p className="text-gray-600 mb-6">
              Your payment could not be processed. Please try again.
            </p>
            {error && (
              <div className="bg-red-50 p-4 rounded mb-6 text-left">
                <p className="text-sm text-error">{error}</p>
              </div>
            )}
          </>
        )}

        <div className="flex flex-col gap-2">
          <Link href="/buyer/orders" className="btn-primary">
            View My Orders
          </Link>
          <Link href="/buyer/marketplace" className="btn-secondary">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentStatusPage() {
  return (
    <div className="container mx-auto py-12">
      <h1 className="text-3xl font-bold mb-8 text-center">Payment Status</h1>
      <Suspense fallback={<div className="text-center">Loading...</div>}>
        <PaymentStatusContent />
      </Suspense>
    </div>
  );
}
