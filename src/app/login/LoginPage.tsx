'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/context/LocaleContext';
import { getApiErrorMessage } from '@/lib/api';
import { requestLoginOtp, verifyLoginOtp } from '@/lib/authOtp';
import { getPostAuthRedirect } from '@/lib/auth-redirect';
import { hasPendingDashboardRequest } from '@/lib/roles';
import { REMEMBER_EMAIL_KEY } from '@/lib/auth-storage';
import PasswordInput from '@/components/auth/PasswordInput';
import FieldLabel from '@/components/ui/FieldLabel';
import { MessageAlert } from '@/components/ui/MessageScreen';
import { INDIAN_PHONE_DIGITS, isValidIndianPhone, sanitizeIndianPhoneInput } from '@/lib/phone';

interface LoginForm {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface OtpRequestForm {
  phone: string;
}

interface OtpVerifyForm {
  otp: string;
}

export default function LoginPage() {
  const { login, user, isAuthenticated, loading: authLoading } = useAuth();
  const { t } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('from');
  const [submitError, setSubmitError] = useState('');
  const [registered, setRegistered] = useState(false);
  const [pendingApproval, setPendingApproval] = useState(false);
  const [otpStep, setOtpStep] = useState<'phone' | 'verify' | 'credentials'>('phone');
  const [otpPhone, setOtpPhone] = useState('');
  const [otpSessionToken, setOtpSessionToken] = useState('');
  const [emailHint, setEmailHint] = useState('');
  const [devOtpHint, setDevOtpHint] = useState('');
  const [autoOtpLoading, setAutoOtpLoading] = useState(false);
  const [resendingOtp, setResendingOtp] = useState(false);
  const [otpVisible, setOtpVisible] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const {
    register: registerOtpRequest,
    handleSubmit: submitOtpRequest,
    reset: resetOtpRequest,
    formState: { errors: otpRequestErrors, isSubmitting: otpRequesting },
  } = useForm<OtpRequestForm>({
    defaultValues: { phone: '' },
  });

  const {
    register: registerOtpVerify,
    handleSubmit: submitOtpVerify,
    formState: { errors: otpVerifyErrors, isSubmitting: otpVerifying },
  } = useForm<OtpVerifyForm>({
    defaultValues: { otp: '' },
  });

  useEffect(() => {
    let cancelled = false;

    const savedEmail = localStorage.getItem(REMEMBER_EMAIL_KEY);
    if (savedEmail) {
      reset({ email: savedEmail, password: '', rememberMe: true });
    }

    const regSuccess = sessionStorage.getItem('registrationSuccess');
    const regPending = sessionStorage.getItem('registrationPending');
    if (regSuccess) {
      setRegistered(true);
      sessionStorage.removeItem('registrationSuccess');
    }
    if (regPending) {
      setPendingApproval(true);
      sessionStorage.removeItem('registrationPending');
    }

    const regPhone = sessionStorage.getItem('registrationPhone');
    if ((regSuccess || regPending) && regPhone && isValidIndianPhone(regPhone)) {
      sessionStorage.removeItem('registrationPhone');

      const sendRegistrationOtp = async () => {
        setAutoOtpLoading(true);
        setSubmitError('');
        try {
          const result = await requestLoginOtp(regPhone);
          if (cancelled) return;
          setOtpPhone(result.phone || regPhone);
          setDevOtpHint(result.devOtp || '');
          setOtpStep('verify');
        } catch (err: unknown) {
          if (!cancelled) {
            setSubmitError(getApiErrorMessage(err, t('auth.login.otpSendFailed')));
            resetOtpRequest({ phone: regPhone });
          }
        } finally {
          if (!cancelled) setAutoOtpLoading(false);
        }
      };

      void sendRegistrationOtp();
    }

    return () => {
      cancelled = true;
    };
  }, [reset, resetOtpRequest, t]);

  useEffect(() => {
    if (!authLoading && isAuthenticated() && user) {
      router.replace(getPostAuthRedirect(user.role, returnTo));
    }
  }, [authLoading, isAuthenticated, user, returnTo, router]);

  const onRequestOtp = async (data: OtpRequestForm) => {
    setSubmitError('');
    setDevOtpHint('');
    try {
      const result = await requestLoginOtp(data.phone);
      setOtpPhone(result.phone || data.phone);
      setDevOtpHint(result.devOtp || '');
      setOtpStep('verify');
    } catch (err: unknown) {
      setSubmitError(getApiErrorMessage(err, t('auth.login.otpSendFailed')));
    }
  };

  const onResendOtp = async () => {
    if (!otpPhone) return;
    setSubmitError('');
    setResendingOtp(true);
    try {
      const result = await requestLoginOtp(otpPhone);
      setDevOtpHint(result.devOtp || '');
    } catch (err: unknown) {
      setSubmitError(getApiErrorMessage(err, t('auth.login.otpSendFailed')));
    } finally {
      setResendingOtp(false);
    }
  };

  const onVerifyOtp = async (data: OtpVerifyForm) => {
    setSubmitError('');
    try {
      const result = await verifyLoginOtp(otpPhone, data.otp);
      setOtpSessionToken(result.otpSessionToken || '');
      setEmailHint(result.emailHint || '');
      reset({
        email: result.emailHint || '',
        password: '',
        rememberMe: false,
      });
      setOtpStep('credentials');
    } catch (err: unknown) {
      setSubmitError(getApiErrorMessage(err, t('auth.login.otpVerifyFailed')));
    }
  };

  const onSubmit = async (data: LoginForm) => {
    setSubmitError('');

    const enteredEmail = data.email.toLowerCase().trim();
    const verifiedEmail = emailHint.toLowerCase().trim();
    if (verifiedEmail && enteredEmail !== verifiedEmail) {
      setSubmitError(t('auth.login.invalidDetails'));
      return;
    }

    try {
      const loggedInUser = await login(
        data.email,
        data.password,
        data.rememberMe,
        otpSessionToken
      );

      if (hasPendingDashboardRequest(loggedInUser.dashboardRequestStatus)) {
        sessionStorage.setItem('dashboardAccessPending', '1');
      }

      if (data.rememberMe) {
        localStorage.setItem(REMEMBER_EMAIL_KEY, data.email);
      } else {
        localStorage.removeItem(REMEMBER_EMAIL_KEY);
      }

      router.replace(getPostAuthRedirect(loggedInUser.role, returnTo));
    } catch (err: unknown) {
      setSubmitError(getApiErrorMessage(err, t('auth.login.signInFailed')));
    }
  };

  if (authLoading) {
    return (
      <div className="flex flex-1 items-center justify-center text-gray-400">
        {t('common.loading')}
      </div>
    );
  }

  return (
    <>
      <div className="mb-8 text-center lg:text-left">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">{t('auth.login.welcome')}</h1>
        <p className="mt-2 text-sm text-gray-500">{t('auth.login.subtitleLong')}</p>
      </div>

      <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-lg shadow-gray-200/50 sm:p-8">
        <div className="space-y-4">
          {pendingApproval && (
            <MessageAlert tone="warning" title={t('myBookings.pendingTitle')}>
              {t('auth.login.pendingApproval')}
            </MessageAlert>
          )}

          {registered && (
            <MessageAlert tone="success">{t('auth.login.registered')}</MessageAlert>
          )}

          {submitError && (
            <MessageAlert tone="error">{submitError}</MessageAlert>
          )}

          {autoOtpLoading && (
            <MessageAlert tone="info">{t('auth.login.requestingOtp')}</MessageAlert>
          )}

          {!autoOtpLoading && otpStep === 'phone' && (
            <form onSubmit={submitOtpRequest(onRequestOtp)} className="space-y-4">
              <div>
                <FieldLabel htmlFor="phone" required>
                  {t('auth.login.phoneLabel')}
                </FieldLabel>
                <input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  inputMode="numeric"
                  maxLength={INDIAN_PHONE_DIGITS}
                  placeholder="9876543210"
                  className={`input-field ${otpRequestErrors.phone ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                  {...registerOtpRequest('phone', {
                    required: t('auth.login.phoneRequired'),
                    validate: (value) =>
                      isValidIndianPhone(value) || t('validation.phone10'),
                    onChange: (event) => {
                      event.target.value = sanitizeIndianPhoneInput(event.target.value);
                    },
                  })}
                />
                {otpRequestErrors.phone && (
                  <p className="mt-1 text-sm text-red-600">{otpRequestErrors.phone.message}</p>
                )}
              </div>
              <button type="submit" disabled={otpRequesting} className="btn-primary w-full">
                {otpRequesting ? t('auth.login.sendingOtp') : t('auth.login.otpSend')}
              </button>
            </form>
          )}

          {!autoOtpLoading && otpStep === 'verify' && (
            <form onSubmit={submitOtpVerify(onVerifyOtp)} className="space-y-4">
              <p className="text-sm text-gray-600">{t('auth.login.otpSentTo', { phone: otpPhone })}</p>
              {devOtpHint && (
                <p className="rounded bg-amber-50 px-3 py-2 text-xs text-amber-700">
                  {t('auth.login.devOtp')}: <strong>{devOtpHint}</strong>
                </p>
              )}
              <div>
                <FieldLabel htmlFor="otp" required>
                  {t('auth.login.enterOtp')}
                </FieldLabel>
                <div className="relative">
                  <input
                    id="otp"
                    type={otpVisible ? 'text' : 'password'}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    className={`input-field pr-11 ${otpVerifyErrors.otp ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                    {...registerOtpVerify('otp', {
                      required: t('auth.login.otpRequired'),
                      pattern: {
                        value: /^\d{6}$/,
                        message: t('validation.otp'),
                      },
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setOtpVisible((value) => !value)}
                    className="absolute right-2.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                    tabIndex={-1}
                    aria-label={otpVisible ? 'Hide OTP' : 'Show OTP'}
                  >
                    {otpVisible ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
                  </button>
                </div>
                {otpVerifyErrors.otp && (
                  <p className="mt-1 text-sm text-red-600">{otpVerifyErrors.otp.message}</p>
                )}
              </div>
              <div className="flex gap-2">
                <button type="button" className="btn-secondary flex-1" onClick={() => setOtpStep('phone')}>
                  {t('auth.login.changePhone')}
                </button>
                <button type="submit" disabled={otpVerifying} className="btn-primary flex-1">
                  {otpVerifying ? t('auth.login.verifying') : t('auth.login.otpVerify')}
                </button>
              </div>
              <button
                type="button"
                disabled={resendingOtp}
                onClick={onResendOtp}
                className="w-full text-center text-sm font-medium text-primary-700 hover:text-primary-800 disabled:opacity-60"
              >
                {resendingOtp ? t('auth.login.sendingOtp') : t('auth.login.resendOtp')}
              </button>
            </form>
          )}

          {!autoOtpLoading && otpStep === 'credentials' && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {emailHint && (
                <p className="text-sm text-gray-600">
                  {t('auth.login.phoneVerified', { email: emailHint })}
                </p>
              )}
              <div>
                <FieldLabel htmlFor="email" required>
                  {t('auth.login.emailAddress')}
                </FieldLabel>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className={`input-field ${errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                  {...register('email', {
                    required: t('auth.login.emailRequired'),
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: t('validation.email'),
                    },
                  })}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                <FieldLabel htmlFor="password" required>
                  {t('auth.login.password')}
                </FieldLabel>
                <PasswordInput
                  id="password"
                  autoComplete="current-password"
                  error={errors.password?.message}
                  {...register('password', { required: t('auth.login.passwordRequired') })}
                />
              </div>

              <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  {...register('rememberMe')}
                />
                {t('auth.login.remember')}
              </label>

              <div className="flex gap-2">
                <button type="button" className="btn-secondary flex-1" onClick={() => setOtpStep('verify')}>
                  {t('auth.login.back')}
                </button>
                <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
                  {isSubmitting ? t('auth.login.signingIn') : t('auth.login.signIn')}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-gray-500">
        {t('auth.login.noAccount')}{' '}
        <Link href="/register" className="font-semibold text-primary-600 hover:underline">
          {t('auth.login.createAccount')}
        </Link>
      </p>
    </>
  );
}
