import { Request, Response } from 'express';
import { z } from 'zod';
import axios from 'axios';
import { prisma } from '../config/database';
import crypto from 'crypto';

const paystackInitiateSchema = z.object({
  orderId: z.string().min(1),
});

const stacksInitiateSchema = z.object({
  orderId: z.string().min(1),
  walletAddress: z.string().min(1),
});

const verifyStacksSchema = z.object({
  transactionId: z.string().min(1),
  orderId: z.string().min(1),
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
          amount: Math.round(order.totalPrice * 100), // Paystack expects amount in kobo
          metadata: {
            orderId: order.id,
            userId: req.user.userId,
            productId: order.productId,
          },
          // For improved security, the callback URL should be a dedicated backend endpoint
          callback_url: `${process.env.FRONTEND_URL}/buyer/orders?orderId=${order.id}`,

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
      
      const { authorization_url, reference } = response.data.data;

      // Store payment record
      await prisma.payment.create({
        data: {
          orderId: order.id,
          userId: req.user.userId,
          type: 'PAYSTACK',
          amount: order.totalPrice,
          reference: reference,
          status: 'PENDING',
        },
      });

      res.json({
        authorization_url,
        reference,
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

// Paystack webhook handler with signature verification
export const handlePaystackWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecretKey) {
      console.error('Paystack secret key is not configured');
      res.status(500).json({ error: 'Webhook configuration missing' });
      return;
    }
    
    const hash = crypto.createHmac('sha512', paystackSecretKey).update(JSON.stringify(req.body)).digest('hex');
    if (hash !== req.headers['x-paystack-signature']) {
      res.status(401).send('Unauthorized');
      return;
    }

    const { event, data } = req.body;

    if (event !== 'charge.success') {
      // Ignore other events like charge.failed, etc.
      res.status(200).json({ message: 'Webhook received, but not a success event.' });
      return;
    }

    // Update payment and order status
    const payment = await prisma.payment.findFirst({
      where: { reference: data.reference },
    });

    if (payment && payment.status !== 'COMPLETED') {
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

    res.status(200).json({ message: 'Webhook processed successfully' });
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

    // Get farmer wallet address
    const farmer = await prisma.user.findUnique({
      where: { id: order.product.farmerId },
      select: { stacksWalletAddress: true }
    });

    if (!farmer || !farmer.stacksWalletAddress) {
      res.status(404).json({ error: 'Farmer\'s Stacks wallet address not found' });
      return;
    }

    // Create payment record for Stacks
    const payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        userId: req.user.userId,
        type: 'STACKS_CRYPTO',
        amount: order.totalPrice, // This amount should be converted to STX on the frontend
        walletAddress: body.walletAddress,
        status: 'PENDING', // Awaiting blockchain confirmation
      },
    });

    res.status(201).json({
      paymentId: payment.id,
      orderId: order.id,
      amount: order.totalPrice, // Send Naira amount, FE converts to STX
      farmerWalletAddress: farmer.stacksWalletAddress,
      contractAddress: process.env.STACKS_CONTRACT_ADDRESS,
      contractName: process.env.STACKS_CONTRACT_NAME,
      message: 'Payment record created. Proceed with Stacks transaction on the frontend.',
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
    
    const { transactionId, orderId } = verifyStacksSchema.parse(req.body);

    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order || order.buyerId !== req.user.userId) {
      res.status(404).json({ error: 'Order not found or unauthorized' });
      return;
    }

    // Verify transaction on Stacks blockchain
    const stacksApiUrl = process.env.STACKS_API_URL || 'https://api.mainnet.hiro.so';
    const txResponse = await axios.get(`${stacksApiUrl}/extended/v1/tx/${transactionId}`);

    // Check if the transaction was successful
    if (txResponse.data.tx_status !== 'success') {
      res.status(400).json({ error: 'Transaction has failed or is not confirmed.' });
      return;
    }

    // --- Add more validation logic here ---
    // 1. Check `contract_call` details (function name, args)
    // 2. Verify that the STX amount transferred matches the order total
    // 3. Confirm the recipient is the smart contract
    
    const payment = await prisma.payment.findFirst({
      where: { 
        orderId,
        status: 'PENDING'
      },
    });

    if (!payment) {
      res.status(404).json({ error: 'No pending payment found for this order' });
      return;
    }

    // Update payment with transaction hash
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        reference: transactionId,
        status: 'COMPLETED', // Or "CONFIRMED_ON_CHAIN"
        metadata: JSON.stringify(txResponse.data),
      },
    });

    // Update order status
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'PAID' },
    });

    res.json({
      payment: updatedPayment,
      message: 'Payment verified and order confirmed',
    });
  } catch (error: any) {
    console.error('Verify Stacks transaction error:', error.response?.data || error.message);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
      return;
    }
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