import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../../models/User';
import { authenticateToken, requireRole, requireApprovedBuyer } from '../auth';

// Mock JWT
jest.mock('jsonwebtoken');
const mockedJwt = jwt as jest.Mocked<typeof jwt>;

// Mock User model
jest.mock('../../models/User');
const mockedUser = User as jest.Mocked<typeof User>;

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      cookies: {},
      headers: {}
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();

    // Set environment variable for tests
    process.env.JWT_SECRET = 'test-secret';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('authenticateToken', () => {
    it('should authenticate valid token from cookie', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        role: 'buyer',
        status: 'approved',
        del_flg: false
      };

      mockRequest.cookies = { 'token-banhmi': 'valid-token' };
      
      mockedJwt.verify.mockReturnValue({
        userId: 'user123',
        email: 'test@example.com',
        role: 'buyer'
      } as any);

      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.user).toEqual({
        userId: 'user123',
        email: 'test@example.com',
        role: 'buyer'
      });
      expect(mockNext).toHaveBeenCalled();
    });

    it('should authenticate valid token from Authorization header', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        role: 'admin',
        status: 'approved',
        del_flg: false
      };

      mockRequest.headers = { authorization: 'Bearer valid-token' };
      
      mockedJwt.verify.mockReturnValue({
        userId: 'user123',
        email: 'test@example.com',
        role: 'admin'
      } as any);

      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.user).toBeDefined();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject request with no token', async () => {
      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Access token required'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request with invalid token', async () => {
      mockRequest.cookies = { 'token-banhmi': 'invalid-token' };
      
      mockedJwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Invalid or expired token'
      });
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('token-banhmi');
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request for deleted user', async () => {
      mockRequest.cookies = { 'token-banhmi': 'valid-token' };
      
      mockedJwt.verify.mockReturnValue({
        userId: 'user123',
        email: 'test@example.com',
        role: 'buyer'
      } as any);

      (User.findById as jest.Mock).mockResolvedValue({
        _id: 'user123',
        del_flg: true
      });

      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'User account not found'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request for blacklisted user', async () => {
      mockRequest.cookies = { 'token-banhmi': 'valid-token' };
      
      mockedJwt.verify.mockReturnValue({
        userId: 'user123',
        email: 'test@example.com',
        role: 'buyer'
      } as any);

      (User.findById as jest.Mock).mockResolvedValue({
        _id: 'user123',
        status: 'blacklisted',
        del_flg: false
      });

      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Account has been blacklisted'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle expired token', async () => {
      mockRequest.cookies = { 'token-banhmi': 'expired-token' };
      
      const tokenExpiredError = new Error('Token expired');
      tokenExpiredError.name = 'TokenExpiredError';
      mockedJwt.verify.mockImplementation(() => {
        throw tokenExpiredError;
      });

      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Token has expired'
      });
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('token-banhmi');
    });
  });

  describe('requireRole', () => {
    beforeEach(() => {
      mockRequest.user = {
        userId: 'user123',
        email: 'test@example.com',
        role: 'buyer'
      };
    });

    it('should allow access for correct role', () => {
      const middleware = requireRole(['buyer', 'admin']);
      
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should deny access for incorrect role', () => {
      const middleware = requireRole(['admin']);
      
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Insufficient permissions'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should deny access when user is not authenticated', () => {
      mockRequest.user = undefined;
      const middleware = requireRole(['buyer']);
      
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Authentication required'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should allow multiple roles', () => {
      mockRequest.user!.role = 'staff';
      const middleware = requireRole(['buyer', 'staff', 'admin']);
      
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('requireApprovedBuyer', () => {
    let mockBuyerProfile: any;

    beforeEach(() => {
      mockRequest.user = {
        userId: 'user123',
        email: 'test@example.com',
        role: 'buyer'
      };

      mockBuyerProfile = {
        _id: 'profile123',
        userId: 'user123',
        name: 'Test User',
        point: 100
      };
    });

    it('should allow access for approved buyer with profile', async () => {
      (User.findById as jest.Mock).mockResolvedValue({
        _id: 'user123',
        status: 'approved',
        del_flg: false
      });

      const { BuyerProfile } = require('../../models/BuyerProfile');
      BuyerProfile.findOne = jest.fn().mockResolvedValue(mockBuyerProfile);

      await requireApprovedBuyer(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.buyerProfile).toEqual(mockBuyerProfile);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should deny access for pending buyer', async () => {
      (User.findById as jest.Mock).mockResolvedValue({
        _id: 'user123',
        status: 'pending',
        del_flg: false
      });

      await requireApprovedBuyer(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Account pending approval'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should deny access for blacklisted buyer', async () => {
      (User.findById as jest.Mock).mockResolvedValue({
        _id: 'user123',
        status: 'blacklisted',
        del_flg: false
      });

      await requireApprovedBuyer(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Account has been blacklisted'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should deny access for buyer without profile', async () => {
      (User.findById as jest.Mock).mockResolvedValue({
        _id: 'user123',
        status: 'approved',
        del_flg: false
      });

      const { BuyerProfile } = require('../../models/BuyerProfile');
      BuyerProfile.findOne = jest.fn().mockResolvedValue(null);

      await requireApprovedBuyer(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Buyer profile not found'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should deny access for non-buyer role', async () => {
      mockRequest.user!.role = 'admin';

      await requireApprovedBuyer(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Buyer access required'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should deny access when user is not authenticated', async () => {
      mockRequest.user = undefined;

      await requireApprovedBuyer(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Authentication required'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      (User.findById as jest.Mock).mockRejectedValue(new Error('Database error'));

      await requireApprovedBuyer(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Internal server error'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});