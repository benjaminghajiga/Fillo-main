'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth';
import { apiClient, getErrorMessage } from '@/lib/api';

interface Earning {
  id: string;
  orderId: string;
  amount: number;
  quantitySold: number;
  status: 'PENDING' | 'COMPLETED' | 'WITHDRAWN';
  description?: string;
  createdAt: string;
}

interface Stats {
  totalEarnings: number;
  completedEarnings: number;
  pendingEarnings: number;
  withdrawnEarnings: number;
  availableToWithdraw: number;
  totalQuantitySold: number;
  totalTransactions: number;
}

interface MonthlyData {
  month: string;
  earnings: number;
  transactions: number;
}

export default function EarningsPage() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    if (!token) {
      router.push('/auth/login');
      return;
    }

    if (user?.role !== 'FARMER') {
      router.push('/');
      return;
    }

    loadEarningsData();
  }, [token, user, router]);

  const loadEarningsData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [earningsRes, statsRes, monthlyRes] = await Promise.all([
        apiClient.getFarmerEarnings(),
        apiClient.getEarningsStats(),
        apiClient.getMonthlyEarnings(),
      ]);

      setEarnings(earningsRes.data.earnings || []);
      setStats(earningsRes.data.summary || statsRes.data);
      setMonthlyData(monthlyRes.data || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (!stats || parseFloat(withdrawAmount) > stats.availableToWithdraw) {
      setError(`Insufficient balance. Available: ₦${stats?.availableToWithdraw || 0}`);
      return;
    }

    try {
      setWithdrawing(true);
      setError('');
      const response = await apiClient.withdrawEarnings(parseFloat(withdrawAmount));
      setSuccess(response.data.message);
      setWithdrawAmount('');
      setTimeout(() => loadEarningsData(), 1500);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setWithdrawing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'WITHDRAWN':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center py-12">
            <p className="text-gray-600">Loading earnings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My Earnings</h1>
          <p className="text-gray-600">Track your sales and manage withdrawals</p>
        </div>

        {/* Error and Success Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            {success}
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Earnings</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  ₦{stats?.totalEarnings?.toLocaleString() || 0}
                </p>
              </div>
              <div className="text-4xl">💰</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Available to Withdraw</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  ₦{stats?.availableToWithdraw?.toLocaleString() || 0}
                </p>
              </div>
              <div className="text-4xl">💵</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Pending</p>
                <p className="text-3xl font-bold text-yellow-600 mt-2">
                  ₦{stats?.pendingEarnings?.toLocaleString() || 0}
                </p>
              </div>
              <div className="text-4xl">⏳</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Sold</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">
                  {stats?.totalQuantitySold?.toFixed(2)} kg
                </p>
              </div>
              <div className="text-4xl">📦</div>
            </div>
          </div>
        </div>

        {/* Withdraw Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Withdraw Earnings</h2>
          <form onSubmit={handleWithdraw} className="max-w-md">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount (₦)
              </label>
              <input
                type="number"
                step="100"
                min="0"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="Enter amount to withdraw"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-600 mt-2">
                Available: ₦{stats?.availableToWithdraw?.toLocaleString() || 0}
              </p>
            </div>
            <button
              type="submit"
              disabled={withdrawing || !stats?.availableToWithdraw}
              className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {withdrawing ? 'Processing...' : 'Withdraw'}
            </button>
          </form>
        </div>

        {/* Monthly Breakdown */}
        {monthlyData.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Monthly Breakdown</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Month</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Earnings</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Transactions</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyData.map((month) => (
                    <tr key={month.month} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{month.month}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-green-600">
                        ₦{month.earnings.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{month.transactions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Earnings History */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Earnings History</h2>
          {earnings.length === 0 ? (
            <p className="text-gray-600 text-center py-8">No earnings yet. Start selling to see your earnings!</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Order ID</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Amount</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Quantity Sold</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {earnings.map((earning) => (
                    <tr key={earning.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {new Date(earning.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                        {earning.orderId.substring(0, 8)}...
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        ₦{earning.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {earning.quantitySold.toFixed(2)} kg
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(earning.status)}`}>
                          {earning.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
