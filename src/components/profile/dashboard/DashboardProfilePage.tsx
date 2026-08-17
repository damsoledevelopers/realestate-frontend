'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Building2,
  MapPin,
  CheckCircle2,
  Users,
  Mail,
  Phone,
  Building,
  MapPinned,
  Calendar,
  Pencil,
  Camera,
  Lock,
  LogOut,
  Trash2,
  LayoutGrid,
  UserPlus,
  CircleCheck,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { api, getApiErrorMessage } from '@/lib/api';
import { notify } from '@/lib/notify';
import { formatRoleLabel } from '@/lib/roles';
import type { NotificationPreferences, ProfileActivity, ProfileStats, User } from '@/lib/types';
import FieldLabel from '@/components/ui/FieldLabel';
import PasswordInput from '@/components/auth/PasswordInput';
import ToggleSwitch from '@/components/ui/ToggleSwitch';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import LanguagePreferenceSection from '@/components/locale/LanguagePreferenceSection';
import { useLocale } from '@/context/LocaleContext';
import { formatDate as formatLocaleDate } from '@/lib/formatLocale';

const DEFAULT_PREFS: NotificationPreferences = {
  emailNotifications: true,
  smsNotifications: false,
  partnerRequests: true,
  newPlotAlerts: true,
  marketingEmails: false,
  loginAlerts: true,
};

const STAT_CARDS = [
  { key: 'totalLayouts' as const, label: 'Total Layouts', icon: Building2, description: 'Active projects' },
  { key: 'totalPlots' as const, label: 'Total Plots', icon: MapPin, description: 'Across all layouts' },
  { key: 'soldPlots' as const, label: 'Sold Plots', icon: CheckCircle2, description: 'Completed sales' },
  { key: 'totalPartners' as const, label: 'Total Partners', icon: Users, description: 'Collaborators' },
];

function formatDate(value: string | undefined, locale: 'en' | 'mr') {
  if (!value) return '—';
  return formatLocaleDate(value, locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function activityIcon(type: string) {
  switch (type) {
    case 'layout':
      return LayoutGrid;
    case 'plot':
      return MapPin;
    case 'profile':
      return CircleCheck;
    case 'user':
      return UserPlus;
    default:
      return CheckCircle2;
  }
}

function ProfileSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-10 w-64 rounded-xl bg-gray-200" />
      <div className="h-44 rounded-2xl bg-gray-200" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-gray-200" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-80 rounded-2xl bg-gray-200" />
        <div className="h-80 rounded-2xl bg-gray-200" />
      </div>
    </div>
  );
}

interface DashboardProfilePageProps {
  variant?: 'dashboard' | 'customer';
}

export default function DashboardProfilePage({ variant = 'dashboard' }: DashboardProfilePageProps) {
  const isCustomerView = variant === 'customer';
  const { user, token, loading: authLoading, logout, updateProfile, refreshUser } = useAuth();
  const { t, locale } = useLocale();
  const fileRef = useRef<HTMLInputElement>(null);

  const [supplementalLoading, setSupplementalLoading] = useState(true);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [activities, setActivities] = useState<ProfileActivity[]>([]);
  const [editingInfo, setEditingInfo] = useState(false);
  const [savingInfo, setSavingInfo] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  const [infoForm, setInfoForm] = useState({
    name: '',
    email: '',
    phone: '',
    companyName: '',
    designation: '',
    address: '',
    city: '',
    state: '',
    country: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [prefs, setPrefs] = useState<NotificationPreferences>(DEFAULT_PREFS);

  const syncFromUser = useCallback((u: User) => {
    setInfoForm({
      name: u.name || '',
      email: u.email || '',
      phone: u.phone || '',
      companyName: u.companyName || '',
      designation: u.designation || '',
      address: u.address || '',
      city: u.city || '',
      state: u.state || '',
      country: u.country || '',
    });
    setPrefs({ ...DEFAULT_PREFS, ...u.notificationPreferences });
  }, []);

  const fetchSupplementalData = useCallback(async () => {
    if (!token) return;
    setSupplementalLoading(true);
    try {
      const [profileStats, profileActivities] = await Promise.all([
        api.get<ProfileStats>('/auth/me/stats', token).catch(() => null),
        api.get<ProfileActivity[]>('/auth/me/activities', token).catch(() => []),
      ]);
      setStats(profileStats);
      setActivities(profileActivities);
    } catch {
      notify.error('Failed to load profile data');
    } finally {
      setSupplementalLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchSupplementalData();
  }, [fetchSupplementalData]);

  useEffect(() => {
    if (user) syncFromUser(user);
  }, [user, syncFromUser]);

  const displayUser = user;
  if ((authLoading || supplementalLoading) && !displayUser) return <ProfileSkeleton />;
  if (!displayUser) return null;

  const initial = displayUser.name?.charAt(0).toUpperCase() || '?';

  const handleAvatarUpload = async (file: File) => {
    if (!token) return;
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      await api.postForm('/auth/me/avatar', formData, token);
      notify.success('Profile photo updated');
      await refreshUser();
    } catch (err: unknown) {
      notify.error(getApiErrorMessage(err, 'Failed to upload photo'));
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveInfo = async () => {
    setSavingInfo(true);
    try {
      await updateProfile({
        name: infoForm.name.trim(),
        email: infoForm.email.trim(),
        phone: infoForm.phone.trim(),
        companyName: infoForm.companyName.trim(),
        designation: infoForm.designation.trim(),
        address: infoForm.address.trim(),
        city: infoForm.city.trim(),
        state: infoForm.state.trim(),
        country: infoForm.country.trim(),
      });
      notify.success('Profile updated');
      setEditingInfo(false);
    } catch (err: unknown) {
      notify.error(getApiErrorMessage(err, 'Failed to update profile'));
    } finally {
      setSavingInfo(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      notify.error('New passwords do not match');
      return;
    }
    setSavingPassword(true);
    try {
      await updateProfile({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword,
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      notify.success('Password updated');
    } catch (err: unknown) {
      notify.error(getApiErrorMessage(err, 'Failed to update password'));
    } finally {
      setSavingPassword(false);
    }
  };

  const handlePrefChange = async (key: keyof NotificationPreferences, value: boolean) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    setSavingPrefs(true);
    try {
      await updateProfile({ notificationPreferences: { [key]: value } });
    } catch {
      setPrefs(prefs);
      notify.error('Failed to update preference');
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!token || !deletePassword) return;
    setDeleting(true);
    try {
      await api.delete('/auth/me', token, { password: deletePassword });
      notify.success('Account deleted');
      setDeleteOpen(false);
      await logout();
    } catch (err: unknown) {
      notify.error(getApiErrorMessage(err, 'Failed to delete account'));
    } finally {
      setDeleting(false);
    }
  };

  const overviewItems = [
    { icon: Mail, label: 'Email', value: displayUser.email },
    { icon: Phone, label: 'Phone', value: displayUser.phone || 'Not set' },
    { icon: Building, label: 'Company', value: displayUser.companyName || 'Not set' },
    { icon: MapPinned, label: 'City', value: displayUser.city || 'Not set' },
    { icon: MapPin, label: 'State', value: displayUser.state || 'Not set' },
    { icon: Calendar, label: t('profile.joined'), value: formatDate(displayUser.createdAt, locale) },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">{t('profile.title')}</h1>
          <p className="mt-1 text-sm text-gray-500">{t('profile.subtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setEditingInfo(true)}
            className="btn-secondary inline-flex items-center gap-2 text-sm"
          >
            <Pencil className="h-4 w-4" />
            {t('profile.editProfile')}
          </button>
          <a href="#security" className="btn-primary inline-flex items-center gap-2 text-sm">
            <Lock className="h-4 w-4" />
            {t('profile.changePassword')}
          </a>
        </div>
      </div>

      {/* Overview card */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
      >
        <div className="grid gap-6 p-6 lg:grid-cols-[auto_1fr] lg:p-8">
          <div className="flex flex-col items-center gap-4 sm:flex-row lg:flex-col lg:items-start">
            <div className="relative">
              <div className="flex h-[100px] w-[100px] items-center justify-center overflow-hidden rounded-full border-4 border-primary-50 bg-primary-100 text-3xl font-bold text-primary-700 shadow-premium">
                {displayUser.avatar ? (
                  <Image
                    src={displayUser.avatar}
                    alt={displayUser.name}
                    width={100}
                    height={100}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  initial
                )}
              </div>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-primary-600 text-white shadow transition hover:bg-primary-700 disabled:opacity-50"
                aria-label="Upload avatar"
              >
                <Camera className="h-4 w-4" />
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleAvatarUpload(file);
                  e.target.value = '';
                }}
              />
            </div>
            <div className="text-center sm:text-left">
              <h2 className="text-xl font-semibold text-gray-900">{displayUser.name}</h2>
              <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <span className="inline-flex rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700 ring-1 ring-inset ring-primary-100">
                  {formatRoleLabel(displayUser.role)}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  Online
                </span>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {overviewItems.map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="flex items-start gap-3 rounded-xl bg-gray-50 px-4 py-3 transition hover:bg-gray-100/80"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-primary-600 shadow-sm">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
                  <p className="mt-0.5 truncate text-sm font-medium text-gray-900">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Stats */}
      {!isCustomerView && (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STAT_CARDS.map(({ key, label, icon: Icon, description }, index) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-premium"
          >
            <div className="flex items-start justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                <Icon className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-4 text-2xl font-bold text-gray-900">
              {stats ? stats[key].toLocaleString() : '—'}
            </p>
            <p className="mt-1 text-sm font-medium text-gray-900">{label}</p>
            <p className="mt-0.5 text-xs text-gray-500">{description}</p>
          </motion.div>
        ))}
      </div>
      )}

      <LanguagePreferenceSection />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Personal information */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{t('profile.personalInfo')}</h3>
              <p className="mt-1 text-sm text-gray-500">{t('profile.accountDetails')}</p>
            </div>
            {!editingInfo && (
              <button
                type="button"
                onClick={() => setEditingInfo(true)}
                className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-primary-600"
                aria-label={t('profile.editInfo')}
              >
                <Pencil className="h-4 w-4" />
              </button>
            )}
          </div>

          {editingInfo ? (
            <form
              className="mt-6 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveInfo();
              }}
            >
              <div className="form-grid">
                <div>
                  <FieldLabel required>{t('profile.fullName')}</FieldLabel>
                  <input
                    className="input-field"
                    value={infoForm.name}
                    onChange={(e) => setInfoForm({ ...infoForm, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <FieldLabel required>{t('profile.email')}</FieldLabel>
                  <input
                    type="email"
                    className="input-field"
                    value={infoForm.email}
                    onChange={(e) => setInfoForm({ ...infoForm, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <FieldLabel>{t('profile.phone')}</FieldLabel>
                  <input
                    className="input-field"
                    value={infoForm.phone}
                    onChange={(e) => setInfoForm({ ...infoForm, phone: e.target.value })}
                  />
                </div>
                <div>
                  <FieldLabel>{t('profile.designation')}</FieldLabel>
                  <input
                    className="input-field"
                    value={infoForm.designation}
                    onChange={(e) => setInfoForm({ ...infoForm, designation: e.target.value })}
                    placeholder={t('profile.designationPlaceholder')}
                  />
                </div>
                <div>
                  <FieldLabel>{t('profile.company')}</FieldLabel>
                  <input
                    className="input-field"
                    value={infoForm.companyName}
                    onChange={(e) => setInfoForm({ ...infoForm, companyName: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <FieldLabel>{t('profile.address')}</FieldLabel>
                  <input
                    className="input-field"
                    value={infoForm.address}
                    onChange={(e) => setInfoForm({ ...infoForm, address: e.target.value })}
                  />
                </div>
                <div>
                  <FieldLabel>{t('profile.city')}</FieldLabel>
                  <input
                    className="input-field"
                    value={infoForm.city}
                    onChange={(e) => setInfoForm({ ...infoForm, city: e.target.value })}
                  />
                </div>
                <div>
                  <FieldLabel>{t('profile.state')}</FieldLabel>
                  <input
                    className="input-field"
                    value={infoForm.state}
                    onChange={(e) => setInfoForm({ ...infoForm, state: e.target.value })}
                  />
                </div>
                <div>
                  <FieldLabel>{t('profile.country')}</FieldLabel>
                  <input
                    className="input-field"
                    value={infoForm.country}
                    onChange={(e) => setInfoForm({ ...infoForm, country: e.target.value })}
                  />
                </div>
                <div>
                  <FieldLabel>{t('profile.role')}</FieldLabel>
                  <input
                    className="input-field bg-gray-50"
                    value={formatRoleLabel(displayUser.role)}
                    disabled
                  />
                </div>
                <div>
                  <FieldLabel>{t('profile.dateJoined')}</FieldLabel>
                  <input
                    className="input-field bg-gray-50"
                    value={formatDate(displayUser.createdAt, locale)}
                    disabled
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={savingInfo} className="btn-primary text-sm">
                  {savingInfo ? t('profile.saving') : t('profile.saveChanges')}
                </button>
                <button
                  type="button"
                  disabled={savingInfo}
                  onClick={() => {
                    syncFromUser(displayUser);
                    setEditingInfo(false);
                  }}
                  className="btn-secondary text-sm"
                >
                  {t('profile.cancel')}
                </button>
              </div>
            </form>
          ) : (
            <dl className="mt-6 divide-y divide-gray-100">
              {[
                [t('profile.fullName'), displayUser.name],
                [t('profile.email'), displayUser.email],
                [t('profile.phone'), displayUser.phone || '—'],
                [t('profile.address'), displayUser.address || '—'],
                [t('profile.city'), displayUser.city || '—'],
                [t('profile.state'), displayUser.state || '—'],
                [t('profile.country'), displayUser.country || '—'],
                [t('profile.role'), formatRoleLabel(displayUser.role)],
                [t('profile.company'), displayUser.companyName || '—'],
                [t('profile.dateJoined'), formatDate(displayUser.createdAt, locale)],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-4 py-3">
                  <dt className="text-sm text-gray-500">{label}</dt>
                  <dd className="text-right text-sm font-medium text-gray-900">{value}</dd>
                </div>
              ))}
            </dl>
          )}
        </section>

        <div className="space-y-6">
          {/* Security */}
          <section id="security" className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">Account Security</h3>
            <p className="mt-1 text-sm text-gray-500">Update your password</p>
            <form onSubmit={handleSavePassword} className="mt-6 space-y-4">
              <div>
                <FieldLabel>Current Password</FieldLabel>
                <PasswordInput
                  placeholder="Enter current password"
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                  }
                />
              </div>
              <div>
                <FieldLabel>New Password</FieldLabel>
                <PasswordInput
                  placeholder="Enter new password"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                  }
                />
              </div>
              <div>
                <FieldLabel>Confirm Password</FieldLabel>
                <PasswordInput
                  placeholder="Confirm new password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                  }
                />
              </div>
              <button type="submit" disabled={savingPassword} className="btn-primary text-sm">
                {savingPassword ? 'Saving...' : 'Save Password'}
              </button>
            </form>
          </section>

          {/* Notifications */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">Notification Preferences</h3>
            <p className="mt-1 text-sm text-gray-500">
              Choose how you want to be notified{savingPrefs ? ' · Saving...' : ''}
            </p>
            <div className="mt-4 divide-y divide-gray-100">
              <ToggleSwitch
                label="Email Notifications"
                description="Receive updates via email"
                checked={prefs.emailNotifications}
                onChange={(v) => handlePrefChange('emailNotifications', v)}
              />
              <ToggleSwitch
                label="SMS Notifications"
                description="Get text message alerts"
                checked={prefs.smsNotifications}
                onChange={(v) => handlePrefChange('smsNotifications', v)}
              />
              <ToggleSwitch
                label="Partner Requests"
                description="When someone requests partnership"
                checked={prefs.partnerRequests}
                onChange={(v) => handlePrefChange('partnerRequests', v)}
              />
              <ToggleSwitch
                label="New Plot Alerts"
                description="When new plots are added"
                checked={prefs.newPlotAlerts}
                onChange={(v) => handlePrefChange('newPlotAlerts', v)}
              />
              <ToggleSwitch
                label="Marketing Emails"
                description="Product news and promotions"
                checked={prefs.marketingEmails}
                onChange={(v) => handlePrefChange('marketingEmails', v)}
              />
              <ToggleSwitch
                label="Login Alerts"
                description="Notify on new sign-ins"
                checked={prefs.loginAlerts}
                onChange={(v) => handlePrefChange('loginAlerts', v)}
              />
            </div>
          </section>
        </div>
      </div>

      {/* Activity timeline */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        <p className="mt-1 text-sm text-gray-500">Your latest actions on the platform</p>
        {activities.length === 0 ? (
          <div className="mt-8 rounded-xl border border-dashed border-gray-200 bg-gray-50 py-10 text-center">
            <p className="text-sm text-gray-500">No recent activity yet</p>
          </div>
        ) : (
          <div className="relative mt-8 space-y-0">
            <div className="absolute left-5 top-2 bottom-2 w-px bg-gray-200" aria-hidden />
            {activities.map((activity, index) => {
              const Icon = activityIcon(activity.type);
              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="relative flex gap-4 pb-6 last:pb-0"
                >
                  <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-white bg-primary-50 text-primary-600 shadow-sm">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1 pt-1">
                    <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {new Date(activity.createdAt).toLocaleString()}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      {/* Danger zone */}
      <section className="rounded-2xl border-2 border-red-200 bg-red-50/50 p-6">
        <h3 className="text-lg font-semibold text-red-900">Danger Zone</h3>
        <p className="mt-1 text-sm text-red-700/80">
          Irreversible actions for your account
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => logout()}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            disabled={isCustomerView}
            className="inline-flex items-center gap-2 rounded-xl border border-red-300 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 shadow-sm transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            Delete Account
          </button>
        </div>
      </section>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete your account?"
        description="This action is permanent. All your data will be removed and cannot be recovered."
        confirmLabel="Delete Account"
        destructive
        loading={deleting}
        onCancel={() => {
          setDeleteOpen(false);
          setDeletePassword('');
        }}
        onConfirm={handleDeleteAccount}
      >
        <div>
          <FieldLabel required>Confirm your password</FieldLabel>
          <PasswordInput
            placeholder="Enter password to confirm"
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
          />
        </div>
      </ConfirmDialog>
    </div>
  );
}
