'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Layout } from '@/lib/types';
import { notify } from '@/lib/notify';
import { getLayoutImages, MAX_LAYOUT_IMAGES } from '@/lib/layoutImages';
import { useLocale } from '@/context/LocaleContext';

export const emptyLayoutForm = {
  name: '',
  description: '',
  location: '',
  lat: '',
  lng: '',
  status: 'active' as 'active' | 'inactive',
};

interface LayoutFormModalProps {
  open: boolean;
  editingLayoutId?: string | null;
  initialLayout?: Layout | null;
  token: string;
  onClose: () => void;
  onSaved: () => void;
}

export default function LayoutFormModal({
  open,
  editingLayoutId,
  initialLayout,
  token,
  onClose,
  onSaved,
}: LayoutFormModalProps) {
  const { t } = useLocale();
  const [layoutForm, setLayoutForm] = useState(emptyLayoutForm);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const [qrImage, setQrImage] = useState<File | null>(null);
  const [savingLayout, setSavingLayout] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (initialLayout) {
      setLayoutForm({
        name: initialLayout.name,
        description: initialLayout.description || '',
        location: initialLayout.location,
        lat: initialLayout.coordinates?.lat?.toString() || '',
        lng: initialLayout.coordinates?.lng?.toString() || '',
        status: initialLayout.status,
      });
      setExistingImages(getLayoutImages(initialLayout));
    } else {
      setLayoutForm(emptyLayoutForm);
      setExistingImages([]);
    }
    setNewImages([]);
    setNewImagePreviews([]);
    setQrImage(null);
  }, [open, initialLayout, editingLayoutId]);

  const clearNewImagePreviews = () => {
    newImagePreviews.forEach((url) => URL.revokeObjectURL(url));
    setNewImages([]);
    setNewImagePreviews([]);
  };

  const handleClose = () => {
    clearNewImagePreviews();
    onClose();
  };

  const addLayoutImages = (files: FileList | null) => {
    if (!files?.length) return;
    const selected = Array.from(files);
    const total = existingImages.length + newImages.length + selected.length;
    if (total > MAX_LAYOUT_IMAGES) {
      notify.error(`You can add up to ${MAX_LAYOUT_IMAGES} images per layout`);
      return;
    }
    setNewImages((prev) => [...prev, ...selected]);
    setNewImagePreviews((prev) => [
      ...prev,
      ...selected.map((file) => URL.createObjectURL(file)),
    ]);
  };

  const saveLayout = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingLayout(true);
    const formData = new FormData();
    formData.append('name', layoutForm.name);
    formData.append('description', layoutForm.description);
    formData.append('location', layoutForm.location);
    formData.append('status', layoutForm.status);
    if (layoutForm.lat) formData.append('lat', layoutForm.lat);
    if (layoutForm.lng) formData.append('lng', layoutForm.lng);
    if (editingLayoutId) formData.append('keepImages', JSON.stringify(existingImages));
    newImages.forEach((file) => formData.append('images', file));
    if (qrImage) formData.append('qrImage', qrImage);

    try {
      if (editingLayoutId) {
        await api.putForm<Layout>(`/layouts/${editingLayoutId}`, formData, token);
        notify.success(t('layoutForm.updated'));
      } else {
        await api.postForm<Layout>('/layouts', formData, token);
        notify.success(t('layoutForm.created'));
      }
      handleClose();
      onSaved();
    } catch (err: unknown) {
      const error = err as { message?: string };
      notify.error(error.message || t('layoutForm.saveFailed'));
    } finally {
      setSavingLayout(false);
    }
  };

  if (!open) return null;

  return (
    <div className="modal-overlay">
      <form onSubmit={saveLayout} className="modal-panel">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-semibold">
            {editingLayoutId ? t('layoutForm.editTitle') : t('layoutForm.addTitle')}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">{t('layoutForm.name')}</label>
            <input
              className="input-field"
              value={layoutForm.name}
              onChange={(e) => setLayoutForm({ ...layoutForm, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">{t('layoutForm.location')}</label>
            <input
              className="input-field"
              value={layoutForm.location}
              onChange={(e) => setLayoutForm({ ...layoutForm, location: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">{t('layoutForm.description')}</label>
            <textarea
              className="input-field"
              rows={3}
              value={layoutForm.description}
              onChange={(e) => setLayoutForm({ ...layoutForm, description: e.target.value })}
            />
          </div>

          <div className="form-grid">
            <div>
              <label className="mb-1 block text-xs font-medium">{t('layoutForm.latitude')}</label>
              <input className="input-field" value={layoutForm.lat} onChange={(e) => setLayoutForm({ ...layoutForm, lat: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">{t('layoutForm.longitude')}</label>
              <input className="input-field" value={layoutForm.lng} onChange={(e) => setLayoutForm({ ...layoutForm, lng: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">{t('layoutForm.status')}</label>
            <select className="input-field" value={layoutForm.status} onChange={(e) => setLayoutForm({ ...layoutForm, status: e.target.value as 'active' | 'inactive' })}>
              <option value="active">{t('layoutForm.statusActive')}</option>
              <option value="inactive">{t('layoutForm.statusInactive')}</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">{t('layoutForm.images')}</label>
            <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="input-field" onChange={(e) => { addLayoutImages(e.target.files); e.target.value = ''; }} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">{t('layoutForm.qrImage')}</label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="input-field"
              onChange={(e) => setQrImage(e.target.files?.[0] || null)}
            />
            <p className="mt-1 text-xs text-gray-500">
              {editingLayoutId ? t('layoutForm.qrImageEditHint') : t('layoutForm.qrImageHint')}
            </p>
          </div>
        </div>
        <div className="btn-stack mt-4">
          <button type="button" onClick={handleClose} className="btn-secondary flex-1">{t('common.cancel')}</button>
          <button type="submit" disabled={savingLayout} className="btn-primary flex-1">
            {savingLayout ? t('layoutForm.saving') : t('common.save')}
          </button>
        </div>
      </form>
    </div>
  );
}
