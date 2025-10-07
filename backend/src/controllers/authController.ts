
import { Request as ExpressRequest, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/db';
import dotenv from 'dotenv';
import { JwtUserPayload } from '../types/express'; // Import the payload type

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET as Secret;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

if (!JWT_SECRET) {
  console.error("FATAL ERROR: JWT_SECRET is not defined in .env file for authController.");
  (process as any).exit(1);
}

interface TokenPayload {
  id: string;
  email: string;
  role: string; // Added role to token payload
  storeId?: string;
}

interface AuthenticatedRequest extends ExpressRequest {
  user?: JwtUserPayload;
}

const generateToken = (id: string, email: string, role: string, storeId?: string) => {
  const payload: TokenPayload = { id, email, role };
  if (storeId) payload.storeId = storeId;
  
  const options: SignOptions = {
    expiresIn: JWT_EXPIRES_IN,
  };
  return jwt.sign(payload, JWT_SECRET, options);
};

export const registerUser = async (req: ExpressRequest, res: Response) => {
  const { name, email, password } = (req as any).body;

  if (!email || !password) {
    return (res as any).status(400).json({ message: 'Please provide email and password' });
  }

  try {
    const userExists = await query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    if (userExists.rows.length > 0) {
      return (res as any).status(400).json({ message: 'User already exists with this email' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const userId = uuidv4();

    // Default role is 'sme' as per schema, so we can retrieve it
    const newUserResult = await query(
      'INSERT INTO users (id, email, password_hash, name) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role, created_at',
      [userId, email.toLowerCase(), passwordHash, name || null]
    );
    const newUser = newUserResult.rows[0];

    // For SME users, create an associated store
    let storeId: string | undefined = undefined;
    if (newUser.role === 'sme') {
        storeId = uuidv4();
        await query(
        'INSERT INTO stores (id, user_id, business_name, onboarding_status) VALUES ($1, $2, $3, $4)',
        [storeId, userId, name ? `${name}'s Store` : 'My Store', 'NOT_STARTED']
        );
    }
    
    const token = generateToken(newUser.id, newUser.email, newUser.role, storeId);

    (res as any).status(201).json({
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role, // Include role in response
      },
    });
  } catch (error) {
    console.error('Error during user registration:', error);
    (res as any).status(500).json({ message: 'Server error during registration' });
  }
};

export const loginUser = async (req: ExpressRequest, res: Response) => {
  const { email, password } = (req as any).body;

  if (!email || !password) {
    return (res as any).status(400).json({ message: 'Please provide email and password' });
  }

  try {
    const userResult = await query(
        'SELECT u.id, u.email, u.password_hash, u.name, u.role, s.id as store_id FROM users u LEFT JOIN stores s ON u.id = s.user_id WHERE u.email = $1', 
        [email.toLowerCase()]
    );

    if (userResult.rows.length === 0) {
      return (res as any).status(401).json({ message: 'Invalid credentials (user not found)' });
    }

    const user = userResult.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return (res as any).status(401).json({ message: 'Invalid credentials (password mismatch)' });
    }
    
    const token = generateToken(user.id, user.email, user.role, user.store_id);

    (res as any).status(200).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role, // Include role in response
      },
    });
  } catch (error) {
    console.error('Error during user login:', error);
    (res as any).status(500).json({ message: 'Server error during login' });
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { 
    return (res as any).status(401).json({ message: 'Not authorized, user not found in request' });
  }
  try {
    const userData = await query(
      'SELECT u.id, u.email, u.name, u.role, s.id as store_id, s.business_name FROM users u LEFT JOIN stores s ON u.id = s.user_id WHERE u.id = $1',
      [req.user.id] 
    );
    if (userData.rows.length === 0) {
      return (res as any).status(404).json({ message: 'User not found in database' });
    }
    const user = userData.rows[0];
    (res as any).status(200).json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role, // Include role in response
      storeId: user.store_id,
      businessName: user.business_name
    });
  } catch (error) {
    console.error('Error fetching current user:', error);
    (res as any).status(500).json({ message: 'Server error' });
  }
};
