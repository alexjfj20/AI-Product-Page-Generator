
import { Request as ExpressRequest, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { JwtUserPayload } from '../types/express'; // Import the payload type

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error("FATAL ERROR: JWT_SECRET is not defined in .env file.");
  (process as any).exit(1);
}

// This interface represents the actual payload decoded from the JWT
interface DecodedJwtPayload extends jwt.JwtPayload { // Extend JwtPayload for standard claims like iat, exp
  id: string;
  email: string;
  storeId?: string; // If you include storeId in the token
}

interface AuthenticatedRequest extends ExpressRequest {
  user?: JwtUserPayload;
}

export const protect = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  let token;

  if ((req as any).headers.authorization && (req as any).headers.authorization.startsWith('Bearer')) {
    token = (req as any).headers.authorization.split(' ')[1];
  }

  if (!token) {
    return (res as any).status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as DecodedJwtPayload;

    // Attach user info to request object.
    req.user = { 
      id: decoded.id,
      email: decoded.email,
      // storeId: decoded.storeId // Add if present in DecodedJwtPayload and JwtUserPayload in express.d.ts
    };
    
    next();
  } catch (error) {
    console.error('JWT verification error:', error);
    (res as any).status(401).json({ message: 'Not authorized, token failed' });
  }
};