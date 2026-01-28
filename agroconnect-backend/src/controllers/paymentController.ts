import { Request, Response } from 'express';
import { z } from 'zod';
import axios from 'axios';
import { prisma } from '../config/database';

const paystackInitiateSchema = z.object({
  orderId: z.string().min(1),
});

const stacksInitiateSchema = z.object({
  orderId: z.string().min(1),
  walletAddress: z.string().min(1),
});

// PAYSTACK INTEGRATION
export const initiatePaystackPayment = async (
  req: any,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const body = paystackInitiateSchema.parse(req.body);

    const order = await prisma.order.findUnique({
      where: { id: body.orderId },
      include: { product: true },
    });

    if (!order || order.buyerId !== req.user.userId) {
      res.status(404).json({ error: 'Order not found or unauthorized' });
      return;
    }

    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecretKey) {
      res.status(500).json({ error: 'Paystack configuration missing' });
      return;
    }

    // Create Paystack charge
    try {
      const response = await axios.post(
        'https://api.paystack.co/transaction/initialize',
        {
          email: req.user.email,
          amount: Math.round(order.totalPrice * 100), // Paystack expects amount in cents
          metadata: {
            orderId: order.id,
            userId: req.user.userId,
            productId: order.productId,
          },
          callback_url: `${process.env.FRONTEND_URL}/orders/${order.id}/payment-status`,
        },
        {
          headers: {
            Authorization: `Bearer ${paystackSecretKey}`,
          },
        }
      );

      if (!response.data.status) {
        res.status(400).json({ error: 'Failed to initialize payment' });
        return;
      }

      // Store payment record
      const payment = await prisma.payment.create({
        data: {
          orderId: order.id,
          userId: req.user.userId,
          type: 'PAYSTACK',
          amount: order.totalPrice,
          reference: response.data.data.reference,
          status: 'PROCESSING',
        },
      });

      res.json({
        payment,
        authorization_url: response.data.data.authorization_url,
        reference: response.data.data.reference,
      });
    } catch (paystackError: any) {
      console.error('Paystack API error:', paystackError.response?.data || paystackError.message);
      res.status(500).json({ error: 'Failed to initialize Paystack payment' });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
      return;
    }
    console.error('Paystack initiate error:', error);
    res.status(500).json({ error: 'Payment initiation failed' });
  }
};

// Paystack webhook handler
export const handlePaystackWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const signature = req.headers['x-paystack-signature'];
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;

    if (!paystackSecretKey) {
      res.status(500).json({ error: 'Webhook configuration missing' });
      return;
    }

    // TODO: Implement signature verification
    // const crypto = require('crypto');
    // const expectedSignature = crypto
    //   .createHmac('sha512', paystackSecretKey)
    //   .update(JSON.stringify(req.body))
    //   .digest('hex');
    // if (signature !== expectedSignature) {
    //   res.status(401).json({ error: 'Invalid signature' });
    //   return;
    // }

    const { data } = req.body;

    if (data.status !== 'success') {
      res.status(200).json({ message: 'Payment failed' });
      return;
    }

    // Update payment status
    const payment = await prisma.payment.findFirst({
      where: { reference: data.reference || undefined },
    });

    if (payment) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'COMPLETED',
          metadata: JSON.stringify(data),
        },
      });

      // Update order status
      await prisma.order.update({
        where: { id: payment.orderId },
        data: { status: 'PAID' },
      });
    }

    res.status(200).json({ message: 'Webhook received' });
  } catch (error) {
    console.error('Paystack webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

// STACKS CRYPTO INTEGRATION
export const initiateStacksPayment = async (
  req: any,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const body = stacksInitiateSchema.parse(req.body);

    const order = await prisma.order.findUnique({
      where: { id: body.orderId },
      include: { product: true },
    });

    if (!order || order.buyerId !== req.user.userId) {
      res.status(404).json({ error: 'Order not found or unauthorized' });
      return;
    }

    // Get farmer wallet address (for receiving STX)
    const farmer = await prisma.user.findUnique({
      where: { id: order.product.farmerId },
    });

    if (!farmer) {
      res.status(404).json({ error: 'Farmer not found' });
      return;
    }

    // Create payment record for Stacks
    const payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        userId: req.user.userId,
        type: 'STACKS_CRYPTO',
        amount: order.totalPrice,
        walletAddress: body.walletAddress,
        status: 'PENDING',
      },
    });

    // TODO: Interact with Stacks smart contract
    // The frontend will handle the actual wallet connection and transaction
    // This endpoint prepares the payment record for tracking

    res.status(201).json({
      payment,
      contractAddress: process.env.STACKS_CONTRACT_ADDRESS,
      contractName: process.env.STACKS_CONTRACT_NAME,
      amount: order.totalPrice,
      orderId: order.id,
      farmerWallet: farmer.id, // Store farmer ID; actual wallet address should be in profile
      message: 'Use this information to initiate Stacks transaction from frontend',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
      return;
    }
    console.error('Stacks initiate error:', error);
    res.status(500).json({ error: 'Payment initiation failed' });
  }
};

// Verify Stacks transaction
export const verifyStacksTransaction = async (
  req: any,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { transactionId, orderId } = req.body;

    if (!transactionId || !orderId) {
      res.status(400).json({ error: 'Missing transactionId or orderId' });
      return;
    }

    // TODO: Verify transaction on Stacks blockchain
    // Query the Stacks API to confirm the transaction is mined
    // const stacksApiUrl = process.env.STACKS_API_URL;
    // const txResponse = await axios.get(`${stacksApiUrl}/tx/${transactionId}`);
    // if (txResponse.data.tx_status === 'success') { ... }

    const payment = await prisma.payment.findFirst({
      where: { orderId },
    });

    if (!payment) {
      res.status(404).json({ error: 'Payment not found' });
      return;
    }

    // Update payment with transaction hash
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        reference: transactionId,
        status: 'COMPLETED',
        metadata: JSON.stringify({ transactionId }),
      },
    });

    // Update order status
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'PAID' },
    });

    res.json({
      payment: updatedPayment,
      message: 'Payment verified',
    });
  } catch (error) {
    console.error('Verify Stacks transaction error:', error);
    res.status(500).json({ error: 'Transaction verification failed' });
  }
};

export const getPaymentStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { paymentId } = req.params;

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { order: true },
    });

    if (!payment) {
      res.status(404).json({ error: 'Payment not found' });
      return;
    }

    res.json(payment);
  } catch (error) {
    console.error('Get payment status error:', error);
    res.status(500).json({ error: 'Failed to fetch payment status' });
  }
};
