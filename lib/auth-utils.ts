import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export const signToken = (payload: any) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
};

export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (e) {
    return null;
  }
};

export const checkRole = (roles: string[], decoded: any) => {
  if (!decoded) return false;
  // Super Admin check
  if (decoded.email === 'ogunwedebo21@gmail.com') return true;
  return roles.includes(decoded.role);
};
