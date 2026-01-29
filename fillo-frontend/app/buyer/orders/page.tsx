'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/auth';
import { apiClient } from '@/lib/api';
import { Order } from '@/lib/types';

export default function BuyerOrdersPage() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      router.push('/auth/login');
      return;
    }

    if (user?.role !== 'BUYER') {
      router.push('/');
      return;
    }

    loadOrders();
  }, [token, user, router]);

  const loadOrders = async () => {
    try {
      const response = await apiClient.getOrders();
      setOrders(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
      case 'DELIVERED':
        return 'bg-green-100 text-green-800';
      case 'PAYMENT_PROCESSING':
      case 'CONFIRMED':
      case 'SHIPPED':
        return 'bg-blue-100 text-blue-800';
      case 'CANCELLED':
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="container mx-auto py-12 text-center">Loading orders...</div>;
  }

  return (
    <div className="container mx-auto py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">My Orders</h1>
        <Link href="/buyer/marketplace" className="btn-primary">
          + New Order
        </Link>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded text-error">
          {error}
        </div>
      )}

      {orders.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-600 mb-6">You haven't placed any orders yet</p>
          <Link href="/buyer/marketplace" className="btn-primary">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map(order => (
            <div key={order.id} className="card">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold">{order.product?.name || 'Unknown Product'}</h3>
                  <p className="text-gray-600 text-sm">Order ID: {order.id}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
              </div>

              <div className="grid md:grid-cols-4 gap-4 mb-6 text-sm">
                <div>
                  <p className="text-gray-600">Quantity</p>
                  <p className="font-semibold">{order.quantity} {order.product?.unit || 'units'}</p>
                </div>
                <div>
                  <p className="text-gray-600">Total Price</p>
                  <p className="font-semibold">₦{order.totalPrice.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-600">Ordered</p>
                  <p className="font-semibold">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-gray-600">Farmer</p>
                  <p className="font-semibold text-xs">{order.product?.farmerId?.substring(0, 8)}...</p>
                </div>
              </div>

              {order.notes && (
                <div className="bg-gray-50 p-4 rounded mb-4">
                  <p className="text-sm font-semibold mb-1">Notes</p>
                  <p className="text-sm text-gray-600">{order.notes}</p>
                </div>
              )}

              <div className="flex gap-2">
                <Link
                  href={`/buyer/order/${order.id}`}
                  className="btn-small flex-1"
                >
                  View Details
                </Link>
                {order.status === 'PENDING' && (
                  <Link
                    href={`/buyer/checkout?productId=${order.productId}`}
                    className="btn-small flex-1 bg-green-600"
                  >
                    Continue to Payment
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
