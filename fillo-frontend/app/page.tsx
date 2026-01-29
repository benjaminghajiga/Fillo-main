'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="container mx-auto py-12">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg p-12 mb-12">
        <h1 className="text-5xl font-bold mb-4">Welcome to Fillo</h1>
        <p className="text-xl mb-8 max-w-2xl">
          The secure agricultural marketplace connecting real farmers with real buyers. 
          Trade agricultural produce with confidence using modern payment systems.
        </p>
        <div className="flex gap-4">
          <Link href="/auth/register?role=FARMER" className="btn-primary bg-white text-green-600 hover:bg-gray-100">
            Register as Farmer
          </Link>
          <Link href="/auth/register?role=BUYER" className="btn-primary">
            Register as Buyer
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div className="grid md:grid-cols-3 gap-8 mb-12">
        <div className="card">
          <div className="text-4xl mb-4">🌾</div>
          <h3 className="text-xl font-bold mb-3">For Farmers</h3>
          <p className="text-gray-600">
            List your agricultural products directly to buyers. Set your own prices and manage orders 
            with a simple dashboard. Get paid securely through bank transfer or blockchain.
          </p>
        </div>
        <div className="card">
          <div className="text-4xl mb-4">🛒</div>
          <h3 className="text-xl font-bold mb-3">For Buyers</h3>
          <p className="text-gray-600">
            Browse fresh agricultural products from verified farmers. Make bulk purchases with 
            transparent pricing. Choose your preferred payment method.
          </p>
        </div>
        <div className="card">
          <div className="text-4xl mb-4">🔒</div>
          <h3 className="text-xl font-bold mb-3">Secure Payments</h3>
          <p className="text-gray-600">
            Multiple payment options: bank transfers (Paystack/Flutterwave) and blockchain payments 
            (Stacks STX). Escrow system protects both parties.
          </p>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-white rounded-lg p-12 mb-12">
        <h2 className="text-3xl font-bold mb-8 text-center">How Fillo Works</h2>
        <div className="grid md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-green-600">
              1
            </div>
            <h4 className="font-bold mb-2">Create Account</h4>
            <p className="text-gray-600 text-sm">Register as a farmer or buyer</p>
          </div>
          <div className="text-center">
            <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-green-600">
              2
            </div>
            <h4 className="font-bold mb-2">Browse/List Products</h4>
            <p className="text-gray-600 text-sm">Farmers add products, buyers browse marketplace</p>
          </div>
          <div className="text-center">
            <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-green-600">
              3
            </div>
            <h4 className="font-bold mb-2">Place Order & Pay</h4>
            <p className="text-gray-600 text-sm">Secure payment with escrow protection</p>
          </div>
          <div className="text-center">
            <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-green-600">
              4
            </div>
            <h4 className="font-bold mb-2">Delivery & Confirmation</h4>
            <p className="text-gray-600 text-sm">Farmer delivers, buyer confirms, funds released</p>
          </div>
        </div>
      </div>

      {/* Payment Options */}
      <div className="bg-blue-50 rounded-lg p-12">
        <h2 className="text-3xl font-bold mb-8 text-center">Multiple Payment Options</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="card">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span>🏦</span> Traditional Bank Transfer
            </h3>
            <ul className="space-y-2 text-gray-600">
              <li>✓ Powered by Paystack and Flutterwave</li>
              <li>✓ Familiar payment method</li>
              <li>✓ Works with local bank accounts</li>
              <li>✓ Instant verification</li>
              <li>✓ Low transaction fees</li>
            </ul>
          </div>
          <div className="card">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span>⛓️</span> Blockchain Crypto (STX)
            </h3>
            <ul className="space-y-2 text-gray-600">
              <li>✓ Stacks (STX) cryptocurrency</li>
              <li>✓ Decentralized smart contract escrow</li>
              <li>✓ Lower fees for international payments</li>
              <li>✓ Transparent & immutable transactions</li>
              <li>✓ No intermediaries</li>
            </ul>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="text-center py-12">
        <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
        <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
          Join thousands of farmers and buyers on Fillo. Start trading agricultural 
          products today with secure, flexible payments.
        </p>
        <Link href="/auth/register" className="btn-primary">
          Create Your Account Now
        </Link>
      </div>
    </div>
  );
}
