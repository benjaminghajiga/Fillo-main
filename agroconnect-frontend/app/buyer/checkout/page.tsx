'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/auth';
import { apiClient } from '@/lib/api';
import { Product } from '@/lib/types';

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, token } = useAuthStore();
  
  const productId = searchParams.get('productId');
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [paymentMethod, setPaymentMethod] = useState<'PAYSTACK' | 'STACKS_CRYPTO'>('PAYSTACK');
  const [walletAddress, setWalletAddress] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!token) {
      router.push('/auth/login');
      return;
    }

    if (user?.role !== 'BUYER') {
      router.push('/');
      return;
    }

    if (!productId) {
      router.push('/buyer/marketplace');
      return;
    }

    loadProduct();
  }, [token, user, router, productId]);

  const loadProduct = async () => {
    try {
      if (!productId) return;
      const response = await apiClient.getProductById(productId);
      setProduct(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setProcessing(true);

    try {
      if (!product) throw new Error('Product not found');

      const qty = parseFloat(quantity);
      if (qty <= 0 || qty > product.quantity) {
        setError('Invalid quantity');
        setProcessing(false);
        return;
      }

      // Create order
      const orderResponse = await apiClient.createOrder({
        productId: product.id,
        quantity: qty,
      });

      const orderId = orderResponse.data.id;

      // Initiate payment
      if (paymentMethod === 'PAYSTACK') {
        const paymentResponse = await apiClient.initiatePaystackPayment(orderId);
        // Redirect to Paystack
        window.location.href = paymentResponse.data.authorization_url;
      } else {
        // STACKS_CRYPTO
        if (!walletAddress) {
          setError('Wallet address is required for crypto payments');
          setProcessing(false);
          return;
        }

        const paymentResponse = await apiClient.initiateStacksPayment(orderId, walletAddress);
        // Redirect to payment confirmation page
        router.push(`/buyer/stacks-payment?orderId=${orderId}&paymentId=${paymentResponse.data.payment.id}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Order creation failed');
      setProcessing(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (!product) {
    return (
      <div className="card text-center py-12">
        <p className="text-error mb-4">Product not found</p>
        <Link href="/buyer/marketplace" className="btn-primary">
          Back to Marketplace
        </Link>
      </div>
    );
  }

  const totalPrice = product.pricePerUnit * parseFloat(quantity || '0');

  return (
    <div className="grid md:grid-cols-2 gap-8">
      {/* Order Summary */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-6">Order Summary</h2>

        {product.image && (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-64 object-cover rounded mb-6"
          />
        )}

        <div className="space-y-4 mb-6 pb-6 border-b">
          <div>
            <h3 className="text-xl font-bold">{product.name}</h3>
            <p className="text-gray-600">{product.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Category</p>
              <p className="font-semibold">{product.category}</p>
            </div>
            <div>
              <p className="text-gray-600">Available</p>
              <p className="font-semibold">{product.quantity} {product.unit}</p>
            </div>
            <div>
              <p className="text-gray-600">Price per Unit</p>
              <p className="font-semibold">₦{product.pricePerUnit.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-600">Unit</p>
              <p className="font-semibold">{product.unit}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between font-semibold">
            <span>Quantity</span>
            <span>{quantity} {product.unit}</span>
          </div>
          <div className="flex justify-between text-lg font-bold text-green-600">
            <span>Total Price</span>
            <span>₦{totalPrice.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Payment Form */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-6">Payment Details</h2>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded text-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmitOrder} className="space-y-6">
          {/* Quantity Input */}
          <div>
            <label className="form-label">Quantity to Order</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="form-input"
              min="0.01"
              step="0.01"
              max={product.quantity}
              required
            />
            <p className="text-sm text-gray-600 mt-1">
              Available: {product.quantity} {product.unit}
            </p>
          </div>

          {/* Payment Method */}
          <div>
            <label className="form-label">Payment Method</label>
            <div className="space-y-3">
              <label className="flex items-center p-4 border-2 rounded cursor-pointer hover:bg-gray-50"
                style={{borderColor: paymentMethod === 'PAYSTACK' ? '#22c55e' : '#d1d5db'}}>
                <input
                  type="radio"
                  value="PAYSTACK"
                  checked={paymentMethod === 'PAYSTACK'}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-4 h-4"
                />
                <div className="ml-4">
                  <p className="font-semibold">🏦 Bank Transfer (Paystack)</p>
                  <p className="text-sm text-gray-600">Pay via bank transfer or card</p>
                </div>
              </label>

              <label className="flex items-center p-4 border-2 rounded cursor-pointer hover:bg-gray-50"
                style={{borderColor: paymentMethod === 'STACKS_CRYPTO' ? '#22c55e' : '#d1d5db'}}>
                <input
                  type="radio"
                  value="STACKS_CRYPTO"
                  checked={paymentMethod === 'STACKS_CRYPTO'}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-4 h-4"
                />
                <div className="ml-4">
                  <p className="font-semibold">⛓️ Stacks Blockchain (STX)</p>
                  <p className="text-sm text-gray-600">Cryptocurrency payment with smart contract</p>
                </div>
              </label>
            </div>
          </div>

          {/* Wallet Address for Crypto */}
          {paymentMethod === 'STACKS_CRYPTO' && (
            <div>
              <label className="form-label">Your Stacks Wallet Address</label>
              <input
                type="text"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                className="form-input"
                placeholder="SP..."
                required={paymentMethod === 'STACKS_CRYPTO'}
              />
              <p className="text-sm text-gray-600 mt-1">
                You'll need to connect your Leather or Xverse wallet to complete the transaction
              </p>
            </div>
          )}

          {/* Order Total */}
          <div className="bg-gray-50 p-4 rounded">
            <div className="flex justify-between mb-2">
              <span>Subtotal</span>
              <span>₦{totalPrice.toLocaleString()}</span>
            </div>
            <div className="flex justify-between mb-4 pb-4 border-b">
              <span>Service Fee</span>
              <span>Free</span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>Total Amount Due</span>
              <span>₦{totalPrice.toLocaleString()}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={processing || !quantity}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? 'Processing...' : `Proceed to Payment (₦${totalPrice.toLocaleString()})`}
          </button>

          <Link
            href="/buyer/marketplace"
            className="w-full btn-secondary block text-center"
          >
            Cancel
          </Link>
        </form>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <div className="container mx-auto py-12">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>
      <Suspense fallback={<div className="text-center">Loading...</div>}>
        <CheckoutContent />
      </Suspense>
    </div>
  );
}
