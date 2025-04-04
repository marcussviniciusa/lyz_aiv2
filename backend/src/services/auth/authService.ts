import jwt from 'jsonwebtoken';
import axios from 'axios';
import { User } from '../../models';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_here';
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '1h';
const JWT_REFRESH_EXPIRATION = process.env.JWT_REFRESH_EXPIRATION || '7d';
const CURSEDUCA_API_KEY = process.env.CURSEDUCA_API_KEY;
const CURSEDUCA_API_URL = process.env.CURSEDUCA_API_URL;

// Generate JWT token
export const generateToken = (user: any) => {
  return jwt.sign(
    { 
      id: user.id,
      email: user.email,
      role: user.role,
      company_id: user.company_id
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRATION }
  );
};

// Generate refresh token
export const generateRefreshToken = (user: any) => {
  return jwt.sign(
    { id: user.id },
    JWT_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRATION }
  );
};

// Verify token
export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// Validate user email against Curseduca API
export const validateCursEducaUser = async (email: string) => {
  try {
    const response = await axios.get(`${CURSEDUCA_API_URL}/members/by`, {
      params: { email },
      headers: { 'api_key': CURSEDUCA_API_KEY }
    });

    if (response.status === 200) {
      return {
        success: true,
        data: response.data
      };
    }
    
    return {
      success: false,
      message: 'User not found in Curseduca'
    };
  } catch (error: any) {
    const status = error.response?.status;
    let message = 'Error validating user in Curseduca';
    
    if (status === 400) {
      message = 'Invalid request to Curseduca API';
    } else if (status === 401) {
      message = 'Unauthorized access to Curseduca API';
    } else if (status === 404) {
      message = 'User not found in Curseduca';
    }
    
    return {
      success: false,
      message
    };
  }
};

// Create user from Curseduca data
export const createUserFromCurseduca = async (cursEducaData: any, password: string, companyId: number) => {
  try {
    const user = await User.create({
      curseduca_id: cursEducaData.id.toString(),
      name: cursEducaData.name,
      email: cursEducaData.email,
      password,
      role: 'user',
      company_id: companyId
    });
    
    return {
      success: true,
      user
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Error creating user'
    };
  }
};

// Get user by email
export const getUserByEmail = async (email: string) => {
  return User.findOne({ where: { email } });
};

// Update last login time
export const updateLastLogin = async (userId: number) => {
  await User.update(
    { last_login: new Date() },
    { where: { id: userId } }
  );
};
