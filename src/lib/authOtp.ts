import { api } from '@/lib/api';

export interface OtpRequestResponse {
  otpSent: boolean;
  expiresInSeconds: number;
  phone: string;
  devOtp?: string;
}

export interface OtpVerifyResponse {
  otpVerified: boolean;
  otpSessionToken: string;
  emailHint: string;
}

export function requestLoginOtp(phone: string) {
  return api.post<OtpRequestResponse>('/auth/login/otp/request', { phone });
}

export function verifyLoginOtp(phone: string, otp: string) {
  return api.post<OtpVerifyResponse>('/auth/login/otp/verify', { phone, otp });
}
