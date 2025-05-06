import crypto from 'crypto';
import { ValidationError } from '../../../../packages/error-handler';
import redis from '../../../../packages/libs/redis';
import { sendMail } from './sendMail';
import { NextFunction } from 'express';

const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;

export const validateRegistrationData = (
  data: any,
  userType: 'user' | 'seller'
) => {
  const { name, email, password, phone_number, country } = data;

  if (
    !name ||
    !email ||
    !password ||
    (userType === 'seller' && (!phone_number || !country))
  ) {
    throw new ValidationError('Missing required fields');
  }

  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email address');
  }

  if (password.length < 8) {
    throw new ValidationError('Password must be at least 8 characters long');
  }
};

export const checkOtpRestriction = async (
  email: string,
  next: NextFunction
) => {
  if (await redis.get(`otp_lock: ${email}`)) {
    return next(
      new ValidationError(
        'Account is locked due to multiple failed attempts. Please try again after 30 minutes.'
      )
    );
  }
  if (await redis.get(`otp_spam_lock:${email}`)) {
    return next(
      new ValidationError(
        'Too many OTP requests. Please wait 1 hour before requesting again.'
      )
    );
  }
  if (await redis.get(`otp_cooldown:${email}  `)) {
    return next(
      new ValidationError('Please wait 1 minute before requesting another OTP.')
    );
  }
};

export const generateOtp = async (
  email: string,
  name: string,
  template: string
) => {
  const otp = crypto.randomInt(1000, 9999).toString();
  await sendMail(email, 'OTP for verification', template, {
    otp,
    name,
  });
  await redis.set(`otp:${email}`, otp, 'EX', 60 * 5);
  await redis.set(`otp_cooldown:${email}`, 'true', 'EX', 60 * 1);
};

export const trackOtpRequest = async (email: string, next: NextFunction) => {
  const otpRequestKey = `otp_request_count:${email}`;
  let otpRequest = parseInt((await redis.get(otpRequestKey)) || '0');
  if (otpRequest >= 2) {
    await redis.set(`otp_spam_lock:${email}`, 'true', 'EX', 60 * 60);
    return next(
      new ValidationError(
        'Account is locked due to multiple failed attempts. Please try again after 1 hour.'
      )
    );
  }
  await redis.set(otpRequestKey, otpRequest + 1, 'EX', 60 * 60);
};

export const verifyOtp = async (
  email: string,
  otp: string,
  next: NextFunction
) => {
  const storeOtp = await redis.get(`otp:${email}`);
  if (!storeOtp) {
    throw new ValidationError('OTP has expired or is invalid');
  }
  const failedAttemptsKey = `otp_attempts:${email}`;
  const failedAttempts = parseInt((await redis.get(failedAttemptsKey)) || '0');
  if (storeOtp !== otp) {
    if (failedAttempts >= 2) {
      await redis.set(`otp_lock:${email}`, 'locked', 'EX', 1800); //Lock account for 30 minutes
      await redis.del(`otp:${email}`, failedAttemptsKey);

      throw new ValidationError(
        'Account is locked due to multiple failed attempts. Please try again after 30 minutes.'
      );
    }
    await redis.set(failedAttemptsKey, failedAttempts + 1, 'EX', 300);
    throw new ValidationError(
      `Invalid OTP. ${2 - failedAttempts} attempts left.`
    );
  }
  await redis.del(`otp:${email}`, failedAttemptsKey);
};

export const handleForgotPassword = (
  req: Request,
  res: Response,
  next: NextFunction,
  userType: 'user' | 'seller'
) => {};
