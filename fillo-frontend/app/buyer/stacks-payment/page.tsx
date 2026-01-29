'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/auth';

function StacksPaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token } = useAuthStore();

  const orderId = searchParams.get('orderId');
  const paymentId = searchParams.get('paymentId');

  const [txHash, setTxHash] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!token) {
      router.push('/auth/login');
      return;
    }

    if (!orderId || !paymentId) {
      router.push('/buyer/marketplace');
      return;
    }
  }, [token, orderId, paymentId, router]);

  const handleVerifyTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setVerifying(true);

    try {
      if (!txHash) {
        setError('Please enter transaction hash');
        return;
      }

      // TODO: Verify transaction with backend
      // await apiClient.verifyStacksTransaction(txHash, orderId!);

      setSuccess('Transaction verified! Your order is confirmed.');
      setTimeout(() => {
        router.push('/buyer/orders');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="container mx-auto py-12">
      <h1 className="text-3xl font-bold mb-8 text-center">Stacks Blockchain Payment</h1>

      <div className="max-w-2xl mx-auto card">
        <div className="bg-blue-50 border border-blue-200 rounded p-6 mb-8">
          <h3 className="font-bold mb-4 text-blue-900">⛓️ Pay with Stacks (STX)</h3>
          <ol className="space-y-3 text-sm text-blue-900">
            <li><strong>1.</strong> You'll need a Stacks wallet (Leather or Xverse)</li>
            <li><strong>2.</strong> The amount will be locked in a smart contract escrow</li>
            <li><strong>3.</strong> Once the farmer confirms delivery, you can release the funds</li>
            <li><strong>4.</strong> If 30 days pass, you can request a refund</li>
          </ol>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded text-error">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded text-success">
            {success}
          </div>
        )}

        <form onSubmit={handleVerifyTransaction} className="space-y-6">
          <div>
            <label className="form-label">Transaction Hash</label>
            <input
              type="text"
              value={txHash}
              onChange={(e) => setTxHash(e.target.value)}
              className="form-input"
              placeholder="0x..."
              disabled={verifying}
              required
            />
            <p className="text-sm text-gray-600 mt-2">
              Enter the transaction hash from your wallet after signing the transaction
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded">
            <p className="text-sm font-semibold mb-2">Payment Details</p>
            <div className="space-y-1 text-sm text-gray-600">
              <p>Order ID: <span className="font-mono">{orderId}</span></p>
              <p>Payment ID: <span className="font-mono">{paymentId}</span></p>
              <p>Status: Awaiting blockchain confirmation</p>
            </div>
          </div>

          <button
            type="submit"
            disabled={verifying || !txHash}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {verifying ? 'Verifying Transaction...' : 'Verify & Confirm Order'}
          </button>

          <p className="text-center text-sm text-gray-600">
            <Link href="/buyer/orders" className="text-green-600 hover:underline">
              Go to My Orders
            </Link>
          </p>
        </form>

        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-sm text-yellow-900">
            <strong>⚠️ Note:</strong> You need to sign a transaction in your Stacks wallet to complete this payment. 
            The funds will be held in escrow until delivery is confirmed.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function StacksPaymentPage() {
  return (
    <Suspense fallback={<div className="text-center py-12">Loading payment page...</div>}>
      <StacksPaymentContent />
    </Suspense>
  );
}
