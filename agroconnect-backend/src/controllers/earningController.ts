import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all earnings for a farmer
export const getFarmerEarnings = async (req: any, res: Response) => {
  try {
    const farmerId = (req as any).user?.id;

    if (!farmerId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const earnings = await (prisma as any).earning.findMany({
      where: { farmerId },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate summary statistics
    const totalEarnings = earnings.reduce((sum: number, e: any) => sum + e.amount, 0);
    const completedEarnings = earnings
      .filter((e: any) => e.status === 'COMPLETED')
      .reduce((sum: number, e: any) => sum + e.amount, 0);
    const pendingEarnings = earnings
      .filter((e: any) => e.status === 'PENDING')
      .reduce((sum: number, e: any) => sum + e.amount, 0);
    const withdrawnEarnings = earnings
      .filter((e: any) => e.status === 'WITHDRAWN')
      .reduce((sum: number, e: any) => sum + e.amount, 0);
    const totalQuantitySold = earnings.reduce((sum: number, e: any) => sum + e.quantitySold, 0);

    return res.json({
      earnings,
      summary: {
        totalEarnings,
        completedEarnings,
        pendingEarnings,
        withdrawnEarnings,
        totalQuantitySold,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// Get earnings statistics for dashboard
export const getEarningsStats = async (req: any, res: Response) => {
  try {
    const farmerId = (req as any).user?.id;

    if (!farmerId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const earnings = await (prisma as any).earning.findMany({
      where: { farmerId },
    });

    const stats = {
      totalEarnings: earnings.reduce((sum: number, e: any) => sum + e.amount, 0),
      completedEarnings: earnings
        .filter((e: any) => e.status === 'COMPLETED')
        .reduce((sum: number, e: any) => sum + e.amount, 0),
      pendingEarnings: earnings
        .filter((e: any) => e.status === 'PENDING')
        .reduce((sum: number, e: any) => sum + e.amount, 0),
      withdrawnEarnings: earnings
        .filter((e: any) => e.status === 'WITHDRAWN')
        .reduce((sum: number, e: any) => sum + e.amount, 0),
      availableToWithdraw: earnings
        .filter((e: any) => e.status === 'COMPLETED')
        .reduce((sum: number, e: any) => sum + e.amount, 0),
      totalQuantitySold: earnings.reduce((sum: number, e: any) => sum + e.quantitySold, 0),
      totalTransactions: earnings.length,
    };

    return res.json(stats);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// Get monthly earnings breakdown
export const getMonthlyEarnings = async (req: any, res: Response) => {
  try {
    const farmerId = (req as any).user?.id;

    if (!farmerId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const earnings = await (prisma as any).earning.findMany({
      where: { farmerId },
      orderBy: { createdAt: 'asc' },
    });

    // Group by month
    const monthlyData: { [key: string]: { total: number; count: number } } = {};

    earnings.forEach((earning: any) => {
      const date = new Date(earning.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { total: 0, count: 0 };
      }
      monthlyData[monthKey].total += earning.amount;
      monthlyData[monthKey].count += 1;
    });

    const monthlyBreakdown = Object.entries(monthlyData).map(([month, data]) => ({
      month,
      earnings: data.total,
      transactions: data.count,
    }));

    return res.json(monthlyBreakdown);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// Create earning record (called when order is completed/paid)
export const createEarning = async (req: Request, res: Response) => {
  try {
    const { farmerId, orderId, productId, amount, quantitySold, description } = req.body;

    if (!farmerId || !orderId || !productId || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const earning = await (prisma as any).earning.create({
      data: {
        farmerId,
        orderId,
        productId,
        amount,
        quantitySold,
        description,
        status: 'PENDING',
      },
    });

    return res.status(201).json(earning);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// Update earning status (mark as completed or withdrawn)
export const updateEarningStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['PENDING', 'COMPLETED', 'WITHDRAWN'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const earning = await (prisma as any).earning.update({
      where: { id },
      data: { status },
    });

    return res.json(earning);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// Withdraw earnings (mark as withdrawn)
export const withdrawEarnings = async (req: any, res: Response) => {
  try {
    const farmerId = (req as any).user?.id;
    const { amount } = req.body;

    if (!farmerId || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get available earnings to withdraw
    const availableEarnings = await (prisma as any).earning.findMany({
      where: {
        farmerId,
        status: 'COMPLETED',
      },
      orderBy: { createdAt: 'asc' },
    });

    let totalAvailable = 0;
    const earningsToWithdraw: string[] = [];

    for (const earning of availableEarnings) {
      if (totalAvailable >= amount) break;
      totalAvailable += earning.amount;
      earningsToWithdraw.push(earning.id);
    }

    if (totalAvailable < amount) {
      return res.status(400).json({ 
        error: `Insufficient balance. Available: ${totalAvailable}, Requested: ${amount}` 
      });
    }

    // Mark selected earnings as withdrawn
    await (prisma as any).earning.updateMany({
      where: { id: { in: earningsToWithdraw } },
      data: { status: 'WITHDRAWN' },
    });

    return res.json({
      success: true,
      message: `Successfully withdrew ₦${amount}`,
      withdrawnAmount: amount,
      remainingAvailable: totalAvailable - amount,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
