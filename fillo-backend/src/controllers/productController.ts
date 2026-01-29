import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';

const createProductSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string().min(1),
  quantity: z.number().positive(),
  unit: z.string().min(1),
  pricePerUnit: z.number().positive(),
  image: z.string().url().optional(),
});

type CreateProductRequest = z.infer<typeof createProductSchema>;

export const createProduct = async (req: any, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const body = createProductSchema.parse(req.body);

    const product = await prisma.product.create({
      data: {
        farmerId: req.user.userId,
        name: body.name,
        description: body.description,
        category: body.category,
        quantity: body.quantity,
        unit: body.unit,
        pricePerUnit: body.pricePerUnit,
        image: body.image,
      },
    });

    res.status(201).json(product);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
      return;
    }
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
};

export const getProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, search, available } = req.query;

    const where: any = {};

    if (category) {
      where.category = { contains: category as string, mode: 'insensitive' };
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (available === 'true') {
      where.available = true;
    }

    const products = await prisma.product.findMany({
      where,
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
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.json(products);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

export const getProductById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
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
    });

    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    res.json(product);
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
};

export const updateProduct = async (req: any, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const body = createProductSchema.partial().parse(req.body);

    // Verify ownership
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product || product.farmerId !== req.user.userId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: body,
    });

    res.json(updatedProduct);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
      return;
    }
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
};

export const deleteProduct = async (req: any, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;

    // Verify ownership
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product || product.farmerId !== req.user.userId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    await prisma.product.delete({ where: { id } });

    res.json({ message: 'Product deleted' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
};

export const getFarmerProducts = async (req: any, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const products = await prisma.product.findMany({
      where: { farmerId: req.user.userId },
      orderBy: { createdAt: 'desc' },
    });

    res.json(products);
  } catch (error) {
    console.error('Get farmer products error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};
