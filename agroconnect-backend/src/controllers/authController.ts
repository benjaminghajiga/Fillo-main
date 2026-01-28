import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['FARMER', 'BUYER']),
  farmName: z.string().optional(),
  location: z.string(),
  crops: z.array(z.string()).optional(),
  companyName: z.string().optional(),
});

type RegisterRequest = z.infer<typeof registerSchema>;

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

type LoginRequest = z.infer<typeof loginSchema>;

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const body = registerSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (existingUser) {
      res.status(409).json({ error: 'User already exists' });
      return;
    }

    const passwordHash = await hashPassword(body.password);

    const user = await prisma.user.create({
      data: {
        email: body.email,
        passwordHash,
        role: body.role,
      },
    });

    // Create role-specific profile
    if (body.role === 'FARMER') {
      await prisma.farmerProfile.create({
        data: {
          userId: user.id,
          farmName: body.farmName || '',
          location: body.location,
          crops: body.crops ? JSON.stringify(body.crops) : null,
        },
      });
    } else if (body.role === 'BUYER') {
      await prisma.buyerProfile.create({
        data: {
          userId: user.id,
          companyName: body.companyName || '',
          location: body.location,
        },
      });
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
      return;
    }
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const body = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const passwordMatch = await comparePassword(body.password, user.passwordHash);

    if (!passwordMatch) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
      return;
    }
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};
