import express, { Router } from 'express';
import {
  forgotPassword,
  login,
  register,
  resetPassword,
  verifyForgotPasswordOTP,
  verifyOTP,
} from '../controllers/auth.controller';

const router: Router = express.Router();

router.post('/register', register);
router.post('/verify-otp', verifyOTP);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp-reset-password', verifyForgotPasswordOTP);
router.post('/reset-password', resetPassword);

export default router;
