import { Request, Response } from 'express';
import { createError } from '../middleware/errorHandler.js';
// Mock User type for development
interface User {
  id: string;
  username: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

// Mock user storage (in production, use a database)
const users = new Map<string, User>();

export const register = async (req: Request, res: Response): Promise<void> => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    throw createError('Username, email, and password are required', 400);
  }

  // Check if user already exists
  const existingUser = Array.from(users.values()).find(
    user => user.email === email || user.username === username
  );

  if (existingUser) {
    throw createError('User with this email or username already exists', 409);
  }

  // Create new user (in production, hash the password)
  const userId = Date.now().toString();
  const user: User = {
    id: userId,
    username,
    email,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  users.set(userId, user);

  // Return user without password
  res.status(201).json({
    message: 'User registered successfully',
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
    token: 'mock-jwt-token', // In production, generate a real JWT
  });
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw createError('Email and password are required', 400);
  }

  // Find user by email
  const user = Array.from(users.values()).find(user => user.email === email);

  if (!user) {
    throw createError('Invalid email or password', 401);
  }

  // In production, verify password hash
  // For now, just return success

  res.status(200).json({
    message: 'Login successful',
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
    token: 'mock-jwt-token', // In production, generate a real JWT
  });
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  const { token } = req.body;

  if (!token) {
    throw createError('Refresh token is required', 400);
  }

  // In production, verify and refresh the JWT token
  res.status(200).json({
    message: 'Token refreshed successfully',
    token: 'new-mock-jwt-token',
  });
};

export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  // In production, extract user from JWT token in Authorization header
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    throw createError('Authorization header is required', 401);
  }

  // Mock response - in production, decode JWT and get user from database
  const mockUser: User = {
    id: '1',
    username: 'MockUser',
    email: 'mock@example.com',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  res.status(200).json({
    user: mockUser,
  });
};