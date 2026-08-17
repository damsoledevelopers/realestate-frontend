'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Plot } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { api, getApiErrorMessage } from '@/lib/api';
import { notify } from '@/lib/notify';
import ConstructionStatusBadge from '@/components/plots/ConstructionStatusBadge';
import StatusBadge from '@/components/property/StatusBadge';
import { formatPrice } from '@/lib/layoutStats';

interface BookingForm {
  fullName: string;
  email: string;
  phone: string;
  message: string;
}

interface BookingModalProps {
  plot: Plot;
  layoutName?: string;
  layoutLocation?: string;
  onClose: () => void;
  onSuccess: (plotId: string) => void;
}

export default function BookingModal({
  plot,
  layoutName,
  layoutLocation,
  onClose,
  onSuccess,
}: BookingModalProps) {
  const { user, token } = useAuth();
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BookingForm>({
    defaultValues: {
      fullName: user?.name || '',
      email: user?.email || '',
      phone: '',
      message: '',
    },
  });

  const onSubmit = async (data: BookingForm) => {
    if (!token) return;
    try {
      await api.post(
        '/bookings',
        {
          plotId: plot._id,
          customerName: data.fullName,
          customerEmail: data.email,
          customerPhone: data.phone,
          message: data.message,
        },
        token
      );
      setSuccess(true);
      onSuccess(plot._id);
      notify.success('Booking submitted successfully!');
    } catch (err: unknown) {
      notify.error(getApiErrorMessage(err, 'Booking failed'));
    }
  };

  if (success) {
    return (
      <div className="modal-overlay">
        <div className="modal-panel-md text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="mt-4 text-lg font-semibold">Booking Submitted!</h2>
          <p className="mt-2 text-sm text-gray-500">
            Your request for Plot {plot.plotNumber} is pending admin approval. You can track
            status in My Bookings.
          </p>
          <button type="button" onClick={onClose} className="btn-primary mt-6 w-full">
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Book Plot</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 rounded-lg border border-primary-100 bg-primary-50 p-4 text-sm">
          <p className="font-semibold text-primary-800">Plot {plot.plotNumber}</p>
          {layoutName && <p className="mt-1 text-primary-700">{layoutName}</p>}
          {layoutLocation && <p className="text-primary-600">{layoutLocation}</p>}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge status={plot.status} size="sm" />
            <ConstructionStatusBadge status={plot.constructionStatus} size="sm" showPattern />
          </div>
          <div className="mt-2 flex flex-wrap gap-3 text-primary-800">
            <span>{plot.size}</span>
            <span className="font-medium">{formatPrice(plot.price)}</span>
            {plot.facing && <span>Facing: {plot.facing}</span>}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4" noValidate>
          <div>
            <label className="mb-1 block text-sm font-medium">Full Name</label>
            <input
              className={`input-field ${errors.fullName ? 'border-red-500' : ''}`}
              {...register('fullName', { required: 'Name is required' })}
            />
            {errors.fullName && (
              <p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <input
              type="email"
              className={`input-field ${errors.email ? 'border-red-500' : ''}`}
              {...register('email', { required: 'Email is required' })}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Phone</label>
            <input
              className={`input-field ${errors.phone ? 'border-red-500' : ''}`}
              {...register('phone', { required: 'Phone is required' })}
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Message (optional)</label>
            <textarea className="input-field" rows={3} {...register('message')} />
          </div>
          <div className="btn-stack">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
              {isSubmitting ? 'Submitting...' : 'Submit Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
