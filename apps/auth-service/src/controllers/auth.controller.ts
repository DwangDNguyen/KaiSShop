import { NextFunction, Request, Response } from 'express';
import {
  checkOtpRestriction,
  generateOtp,
  trackOtpRequest,
  validateRegistrationData,
  verifyOtp,
} from '../utils/auth.helper';
import prisma from '../../../../packages/libs/prisma';
import { AuthError, ValidationError } from '../../../../packages/error-handler';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { setCookie } from '../utils/cookies/setCookie';

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    validateRegistrationData(req.body, 'user');
    const { email, name } = req.body;

    const existingUser = await prisma.users.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return next(new ValidationError('User already exists'));
    }

    await checkOtpRestriction(email, next);
    await trackOtpRequest(email, next);
    await generateOtp(email, name, 'user-activation-mail');

    res.status(200).json({
      message: 'OTP sent to email. Please verify your account.',
    });
  } catch (err) {
    return next(err);
  }
};

export const verifyOTP = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, otp, password, name } = req.body;
    if (!email || !otp || !password || !name) {
      return next(new ValidationError('All fields are required'));
    }
    const existingUser = await prisma.users.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return next(new ValidationError('User already exists'));
    }

    await verifyOtp(email, otp, next);
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.users.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    res.status(200).json({
      success: true,
      message: 'User created successfully',
      user,
    });
  } catch (err: any) {
    return next(err);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return next(new ValidationError('Email and password are required'));
    }
    const user = await prisma.users.findUnique({
      where: {
        email,
      },
    });
    if (!user) {
      return next(new AuthError('User not found!'));
    }

    const isValidPassword = await bcrypt.compare(password, user.password!);
    if (!isValidPassword) {
      return next(new AuthError('Invalid email or password'));
    }

    const accessToken = jwt.sign(
      { id: user.id, role: 'user' },
      process.env.ACCESS_TOKEN_SECRET as string,
      {
        expiresIn: '15m',
      }
    );

    const refreshToken = jwt.sign(
      { id: user.id, role: 'user' },
      process.env.REFRESH_TOKEN_SECRET as string,
      {
        expiresIn: '7d',
      }
    );

    setCookie(res, 'accessToken', accessToken);
    setCookie(res, 'refreshToken', refreshToken);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      user,
    });
  } catch (err: any) {
    return next(err);
  }
};

export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.body;
    if (!email) {
      throw new ValidationError('Email is required');
    }
    const user = await prisma.users.findUnique({
      where: {
        email,
      },
    });
    if (!user) {
      throw new ValidationError('User not found!');
    }
    await checkOtpRestriction(email, next);
    await trackOtpRequest(email, next);
    await generateOtp(email, user.name, 'forgot-password-mail');

    res.status(200).json({
      success: true,
      message: 'OTP sent to email. Please verify your account.',
    });
  } catch (err: any) {
    return next(err);
  }
};

export const verifyForgotPasswordOTP = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      throw new ValidationError('Email and OTP are required');
    }
    await verifyOtp(email, otp, next);

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
    });
  } catch (err: any) {
    return next(err);
  }
};

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
      throw new ValidationError('Email and new password are required');
    }
    const user = await prisma.users.findUnique({
      where: {
        email,
      },
    });
    if (!user) {
      throw new ValidationError('User not found!');
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.password!);
    if (isSamePassword) {
      throw new ValidationError(
        'New password cannot be the same as old password'
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.users.update({
      where: {
        email,
      },
      data: {
        password: hashedPassword,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (err: any) {
    return next(err);
  }
};
