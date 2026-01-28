import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';

const createOrderSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().positive(),
  notes: z.string().optional(),
});

type CreateOrderRequest = z.infer<typeof createOrderSchema>;

export const createOrder = async (req: any, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const body = createOrderSchema.parse(req.body);

    // Verify product exists and get price
    const product = await prisma.product.findUnique({
      where: { id: body.productId },
    });

    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    if (!product.available || product.quantity < body.quantity) {
      res.status(400).json({ error: 'Insufficient product quantity' });
      return;
    }

    const totalPrice = product.pricePerUnit * body.quantity;

    const order = await prisma.order.create({
      data: {
        buyerId: req.user.userId,
        productId: body.productId,
        quantity: body.quantity,
        totalPrice,
        notes: body.notes,
      },
      include: {
        product: true,
        buyer: {
          select: {
            id: true,
            email: true,
            buyerProfile: {
              select: {
                companyName: true,
                location: true,
              },
            },
          },
        },
      },
    });

    res.status(201).json(order);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
      return;
    }
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
};

export const getOrders = async (req: any, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const orders = await prisma.order.findMany({
      where: {
        buyerId: req.user.userId,
      },
      include: {
        product: {
          include: {
            farmer: {
              select: {
                id: true,
                email: true,
                farmerProfile: {
                  select: {
                    farmName: true,
                    location: true,
                  },
                },
              },
            },
          },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(orders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

export const getOrderById = async (req: any, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        product: {
          include: {
            farmer: {
              select: {
                id: true,
                email: true,
                farmerProfile: {
                  select: {
                    farmName: true,
                    location: true,
                    phone: true,
                  },
                },
              },
            },
          },
        },
        buyer: {
          select: {
            id: true,
            email: true,
            buyerProfile: {
              select: {
                companyName: true,
                location: true,
              },
            },
          },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    // Verify user is either buyer or farmer
    if (order.buyerId !== req.user.userId && order.product.farmer.id !== req.user.userId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    res.json(order);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
};

export const updateOrderStatus = async (req: any, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const { status } = req.body;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        product: true,
      },
    });

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    // Only farmer or buyer can update
    if (order.product.farmerId !== req.user.userId && order.buyerId !== req.user.userId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status },
      include: {
        product: true,
        payments: true,
      },
    });

    res.json(updatedOrder);
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
};

export const getFarmerOrders = async (req: any, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const orders = await prisma.order.findMany({
      where: {
        product: {
          farmerId: req.user.userId,
        },
      },
      include: {
        product: true,
        buyer: {
          select: {
            id: true,
            email: true,
            buyerProfile: {
              select: {
                companyName: true,
                location: true,
              },
            },
          },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(orders);
  } catch (error) {
    console.error('Get farmer orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};
