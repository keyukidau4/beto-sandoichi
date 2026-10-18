import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { BuyerProfile } from '../models/BuyerProfile';
import { validateRegister, validateLogin } from '../utils/validation';

import {config} from "dotenv"
import { RequestUser } from '@/types/express';

config();

// Generate JWT token
const generateToken = (userId: string, email: string, role: string): string => {
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  return jwt.sign(
    { userId, email, role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// Set JWT token as httpOnly cookie
const setTokenCookie = (res: Response, token: string) => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  res.cookie('token-banhmi', token, {
    httpOnly: true,
    secure: isProduction, // HTTPS only in production
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    path: '/'
  });
};

// Register new user
export const register = async (req: Request, res: Response) => {
  try {
    // Validate input
    const { error, value } = validateRegister(req.body);
    if (error) {
      return res.status(400).json({
        message: 'Validation error',
        errors: error.details.map(detail => detail.message)
      });
    }

    const { email, password, name, tel, zip1, zip2, address1, address2 } = value;

    // Check if user already exists
    const existingUser = await User.findOne({ email }).select('+del_flg');
    if (existingUser && !existingUser.del_flg) {
      return res.status(409).json({
        message: 'User with this email already exists'
      });
    }

    // Create new user with buyer role and pending status
    const user = new User({
      email,
      password,
      role: 'buyer',
      status: 'pending'
    });

    await user.save();

    // Create buyer profile
    const buyerProfile = new BuyerProfile({
      userId: user._id,
      name,
      tel,
      zip1,
      zip2,
      address1,
      address2,
      point: 0
    });

    await buyerProfile.save();

    // Generate token
    const token = generateToken(user._id.toString(), user.email, user.role);
    
    // Set token cookie
    setTokenCookie(res, token);

    // Return user info (password excluded by toJSON transform)
    return res.status(201).json({
      message: 'Registration successful. Account pending approval.',
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      message: 'Registration failed. Please try again.'
    });
  }
};

// Login user
export const login = async (req: Request, res: Response) => {
  try {
    // Validate input
    const { error, value } = validateLogin(req.body);
    if (error) {
      return res.status(400).json({
        message: 'Validation error',
        errors: error.details.map(detail => detail.message)
      });
    }

    const { email, password } = value;

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }

    // Check if user is blacklisted
    if (user.status === 'blacklisted') {
      return res.status(403).json({
        message: 'Account has been suspended. Please contact support.'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    //buyer profile
    const buyerProfile = await BuyerProfile.findOne({userId: user._id})

    // Generate token
    const token = generateToken(user._id.toString(), user.email, user.role);
    
    // Set token cookie
    setTokenCookie(res, token);

    // Return user info (password excluded by toJSON transform)
    return res.status(200).json({
      message: 'Login successful',
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        status: user.status,
        lastLogin: user.lastLogin
      },
      buyerProfile
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      message: 'Login failed. Please try again.'
    });
  }
};

// Logout user
export const logout = async (req: Request, res: Response) => {
  try {
    // Clear the token cookie (using correct cookie name)
    res.clearCookie('token-banhmi', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      path: '/'
    });

    return res.status(200).json({
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      message: 'Logout failed. Please try again.'
    });
  }
};

// Get current user info
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const requestUser = req as unknown as RequestUser
    if (!requestUser.user) {
      return res.status(401).json({
        message: 'Not authenticated'
      });
    }

    // Get buyer profile if user is a buyer
    let buyerProfile = null;
    if (requestUser.user.role === 'buyer') {
      buyerProfile = await BuyerProfile.findOne({ userId: requestUser.user._id });
    }

    return res.status(200).json({
      user: {
        id: requestUser.user._id,
        email: requestUser.user.email,
        role: requestUser.user.role,
        status: requestUser.user.status,
        lastLogin: requestUser.user.lastLogin,
        createdAt: requestUser.user.createdAt
      },
      buyerProfile: buyerProfile ? {
        name: buyerProfile.name,
        tel: buyerProfile.tel,
        zip1: buyerProfile.zip1,
        zip2: buyerProfile.zip2,
        address1: buyerProfile.address1,
        address2: buyerProfile.address2,
        point: buyerProfile.point
      } : null
    });

  } catch (error) {
    console.error('Get current user error:', error);
    return res.status(500).json({
      message: 'Failed to get user information'
    });
  }
};