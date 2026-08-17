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
import RegistrationDocumentField, {
  validateRegistrationDocument,
} from '@/components/auth/RegistrationDocumentField';
import FieldLabel from '@/components/ui/FieldLabel';

type AccountType = 'customer' | 'layout_manager';

interface RegisterForm {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  accountType: AccountType;
  requestNote: string;
}

export default function RegisterPage() {
  const { register: registerUser, user, isAuthenticated, loading: authLoading } = useAuth();
  const { t } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('from');
  const [submitError, setSubmitError] = useState('');
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentError, setDocumentError] = useState('');

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
      accountType: 'customer',
      requestNote: '',
    },
  });

  const password = watch('password');
  const accountType = watch('accountType');

  useEffect(() => {
    if (!authLoading && isAuthenticated() && user) {
      router.replace(getPostAuthRedirect(user.role, returnTo));
    }
  }, [authLoading, isAuthenticated, user, returnTo, router]);

  const onSubmit = async (data: RegisterForm) => {
    setSubmitError('');
    setDocumentError('');

    if (data.accountType === 'layout_manager' && documentFile) {
      const validationError = validateRegistrationDocument(documentFile);
      if (validationError) {
        setDocumentError(validationError);
        return;
      }
    }

    try {
      const result = await registerUser({
        ...data,
        document: documentFile,
      });

      if (result.pendingApproval) {
        sessionStorage.setItem('registrationPending', '1');
      } else {
        sessionStorage.setItem('registrationSuccess', '1');
      }
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
    <div className="min-w-0 w-full">
      <div className="mb-6 text-center lg:mb-8 lg:text-left">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">{t('auth.register.title')}</h1>
        <p className="mt-2 text-sm text-gray-500">{t('auth.register.subtitle')}</p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="min-w-0 w-full max-w-full rounded-2xl border border-gray-200/80 bg-white p-5 shadow-lg shadow-gray-200/50 sm:p-8"
        noValidate
      >
        <div className="space-y-4">
          {submitError && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {submitError}
            </div>
          )}

          <div>
            <span className="mb-2 block text-sm font-medium text-gray-900">
              {t('auth.register.accountTypeLabel')}
              <span className="ml-0.5 text-red-500" aria-hidden="true">
                *
              </span>
            </span>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <label
                className={`flex min-w-0 cursor-pointer items-start gap-3 rounded-xl border p-3 transition hover:bg-gray-50 ${
                  accountType === 'customer'
                    ? 'border-primary-500 bg-primary-50/40 ring-1 ring-primary-500/30'
                    : 'border-gray-200'
                }`}
              >
                <input
                  type="radio"
                  value="customer"
                  className="mt-1"
                  {...register('accountType')}
                />
                <span>
                  <span className="block text-sm font-semibold text-gray-900">
                    {t('auth.register.buyerTitle')}
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-gray-600">
                    {t('auth.register.buyerDesc')}
                  </span>
                </span>
              </label>
              <label
                className={`flex min-w-0 cursor-pointer items-start gap-3 rounded-xl border p-3 transition hover:bg-gray-50 ${
                  accountType === 'layout_manager'
                    ? 'border-primary-500 bg-primary-50/40 ring-1 ring-primary-500/30'
                    : 'border-gray-200'
                }`}
              >
                <input
                  type="radio"
                  value="layout_manager"
                  className="mt-1"
                  {...register('accountType')}
                />
                <span>
                  <span className="block text-sm font-semibold text-gray-900">
                    {t('auth.register.sellerTitle')}
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-gray-600">
                    {t('auth.register.sellerDesc')}
                  </span>
                </span>
              </label>
            </div>
          </div>

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
              autoComplete="tel"
              inputMode="numeric"
              maxLength={INDIAN_PHONE_DIGITS}
              placeholder="9876543210"
              className={`input-field ${errors.phone ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
              {...register('phone', {
                required: t('auth.register.phoneRequired'),
                validate: (value) =>
                  isValidIndianPhone(value) || t('validation.phone10'),
                onChange: (event) => {
                  event.target.value = sanitizeIndianPhoneInput(event.target.value);
                },
              })}
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
            )}
          </div>

          <div>
            <FieldLabel htmlFor="password" required>
              {t('auth.login.password')}
            </FieldLabel>
            <PasswordInput
              id="password"
              autoComplete="new-password"
              error={errors.password?.message}
              {...register('password', {
                required: t('auth.register.passwordRequired'),
                minLength: { value: 6, message: t('auth.register.passwordMin') },
              })}
            />
          </div>

          <div>
            <FieldLabel htmlFor="confirmPassword" required>
              {t('auth.register.confirmPassword')}
            </FieldLabel>
            <PasswordInput
              id="confirmPassword"
              autoComplete="new-password"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword', {
                required: t('auth.register.confirmRequired'),
                validate: (value) => value === password || t('auth.register.passwordMismatch'),
              })}
            />
          </div>

          {accountType === 'layout_manager' && (
            <>
              <div>
                <label htmlFor="requestNote" className="mb-1 block text-sm font-medium text-gray-900">
                  {t('auth.register.sellerNoteLabel')}
                </label>
                <textarea
                  id="requestNote"
                  rows={3}
                  className="input-field"
                  placeholder={t('auth.register.sellerNotePlaceholder')}
                  {...register('requestNote')}
                />
              </div>

              <RegistrationDocumentField
                label={t('auth.register.sellerDocumentLabel')}
                hint={t('auth.register.sellerDocumentHint')}
                file={documentFile}
                error={documentError}
                onChange={setDocumentFile}
                onError={setDocumentError}
              />

              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-800">
                {t('auth.register.sellerApprovalNote')}
              </div>
            </>
          )}

          <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
            {isSubmitting
              ? t('auth.register.submitting')
              : accountType === 'layout_manager'
                ? t('auth.register.submitRequest')
                : t('auth.register.submit')}
          </button>
        </div>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        {t('auth.register.haveAccount')}{' '}
        <Link href="/login" className="font-semibold text-primary-600 hover:underline">
          {t('auth.register.signIn')}
        </Link>
      </p>
    </div>
  );
}
