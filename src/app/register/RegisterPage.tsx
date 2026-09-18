'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/context/LocaleContext';
import { getApiErrorMessage } from '@/lib/api';
import { INDIAN_PHONE_DIGITS, isValidIndianPhone, sanitizeIndianPhoneInput } from '@/lib/phone';
import { getPostAuthRedirect } from '@/lib/auth-redirect';
import PasswordInput from '@/components/auth/PasswordInput';
import FieldLabel from '@/components/ui/FieldLabel';

interface RegisterForm {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

export default function RegisterPage() {
  const { register: registerUser, user, isAuthenticated, loading: authLoading } = useAuth();
  const { t } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('from');
  const [submitError, setSubmitError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    mode: 'onChange',
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
  });

  const password = watch('password');

  useEffect(() => {
    if (!authLoading && isAuthenticated() && user) {
      router.replace(getPostAuthRedirect(user.role, returnTo));
    }
  }, [authLoading, isAuthenticated, user, returnTo, router]);

  const onSubmit = async (data: RegisterForm) => {
    setSubmitError('');

    try {
      await registerUser({
        ...data,
        accountType: 'customer',
      });

      sessionStorage.setItem('registrationSuccess', '1');
      sessionStorage.setItem('registrationPhone', data.phone);

      router.push('/login');
    } catch (err: unknown) {
      setSubmitError(getApiErrorMessage(err, t('auth.register.failed')));
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
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">{t('auth.register.title')}</h1>
        <p className="mt-2 text-sm text-gray-500">{t('auth.register.subtitle')}</p>
        <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">
          {t('auth.register.sellViaAdminNote')}
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5" noValidate>
          {submitError && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {submitError}
            </div>
          )}

          <div>
            <FieldLabel htmlFor="name" required>
              {t('profile.fullName')}
            </FieldLabel>
            <input
              id="name"
              autoComplete="name"
              className={`input-field ${errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
              {...register('name', { required: t('auth.register.nameRequired') })}
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
          </div>

          <div>
            <FieldLabel htmlFor="email" required>
              {t('profile.email')}
            </FieldLabel>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className={`input-field ${errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
              {...register('email', {
                required: t('auth.register.emailRequired'),
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
            <FieldLabel htmlFor="phone" required>
              {t('auth.register.phoneLabel')}
            </FieldLabel>
            <input
              id="phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              maxLength={INDIAN_PHONE_DIGITS}
              className={`input-field ${errors.phone ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
              {...register('phone', {
                required: t('auth.register.phoneRequired'),
                validate: (value) =>
                  isValidIndianPhone(value) || t('validation.phone10'),
                setValueAs: (value) => sanitizeIndianPhoneInput(String(value ?? '')),
              })}
            />
            {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>}
          </div>

          <div>
            <FieldLabel htmlFor="password" required>
              {t('profile.password')}
            </FieldLabel>
            <PasswordInput
              id="password"
              autoComplete="new-password"
              className={errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
              {...register('password', {
                required: t('auth.register.passwordRequired'),
                minLength: { value: 6, message: t('auth.register.passwordMin') },
              })}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          <div>
            <FieldLabel htmlFor="confirmPassword" required>
              {t('auth.register.confirmPassword')}
            </FieldLabel>
            <PasswordInput
              id="confirmPassword"
              autoComplete="new-password"
              className={
                errors.confirmPassword ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
              }
              {...register('confirmPassword', {
                required: t('auth.register.confirmRequired'),
                validate: (value) => value === password || t('auth.register.passwordMismatch'),
              })}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
            )}
          </div>

          <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
            {isSubmitting ? t('auth.register.submitting') : t('auth.register.submit')}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          {t('auth.register.haveAccount')}{' '}
          <Link href="/login" className="font-semibold text-primary-600 hover:underline">
            {t('auth.register.signIn')}
          </Link>
        </p>
      </div>
    </div>
  );
}
