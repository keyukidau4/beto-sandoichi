import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';

interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

// JWT Authentication middleware
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from httpOnly cookie (using correct cookie name)
    const token = req.cookies['token-banhmi'];

    if (!token) {
      return res.status(401).json({ 
        message: 'Access denied. No token provided.' 
      });
    }

    // Verify token
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    
    // Get user from database
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ 
        message: 'Invalid token. User not found.' 
      });
    }

    // Check if user is not blacklisted
    if (user.status === 'blacklisted') {
      return res.status(403).json({ 
        message: 'Account has been suspended.' 
      });
    }

    // Attach user to request object
    req.user = user;
    return next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ 
        message: 'Invalid token.' 
      });
    }
    
    console.error('Authentication error:', error);
    return res.status(500).json({ 
      message: 'Authentication failed.' 
    });
  }
};

// Role-based authorization middleware
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Authentication required.' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Insufficient permissions.' 
      });
    }

    return next();
  };
};

// Middleware to check if buyer is approved for point payments
export const requireApprovedBuyer = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ 
      message: 'Authentication required.' 
    });
  }

  if (req.user.role === 'buyer' && req.user.status !== 'approved') {
    return res.status(403).json({ 
      message: 'Account pending approval. Only COD payment available.' 
    });
  }

  return next();
};

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies['token-banhmi'];
    
    if (token) {
      const JWT_SECRET = process.env.JWT_SECRET;
      if (JWT_SECRET) {
        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
        const user = await User.findById(decoded.userId);
        
        if (user && user.status !== 'blacklisted') {
          req.user = user;
        }
      }
    }
    
    return next();
  } catch (error) {
    // Continue without authentication if token is invalid
    return next();
  }
};