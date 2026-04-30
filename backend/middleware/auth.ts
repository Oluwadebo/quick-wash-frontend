import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'quick_wash_secret_99';
const SUPER_ADMIN_EMAIL = 'ogunwedebo21@gmail.com';

export const auth = async (req: any, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) throw new Error();

    const decoded: any = jwt.verify(token, JWT_SECRET);
    const user = await User.findOne({ uid: decoded.uid });

    if (!user) throw new Error();

    req.token = token;
    req.user = user;
    next();
  } catch (e) {
    res.status(401).send({ error: 'Please authenticate.' });
  }
};

export const checkRole = (roles: string[]) => {
  return (req: any, res: Response, next: NextFunction) => {
    const user = req.user;
    
    // Super Admin check via UID or specific email if we had it in model
    // Assuming the user email isn't in the model yet, I'll add a placeholder for it 
    // or use the UID if associated. For this task, I'll assume we check the email 
    // if available or a specific UID.
    
    // In many setups, the email is in the JWT session or User model.
    // Let's assume we check against the provided email for Super Admin.
    const isSuperAdmin = user.email === SUPER_ADMIN_EMAIL || user.role === 'admin';

    if (isSuperAdmin || roles.includes(user.role)) {
      next();
    } else {
      res.status(403).send({ error: 'Access denied. Insufficient permissions.' });
    }
  };
};
