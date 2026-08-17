'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useLocale } from '@/context/LocaleContext';
import { usePropertyStatusConfig } from '@/context/PropertyStatusConfigContext';
import { notify } from '@/lib/notify';
import { getApiErrorMessage } from '@/lib/api';
import { createProperty, updateProperty } from '@/lib/propertyApi';
import { Property, PropertyType } from '@/lib/types';

const AREA_UNITS = ['sqft', 'sqm', 'acre', 'hectare'] as const;

export interface PropertyFormValues {
  name: string;
  propertyNumber: string;
  areaValue: string;
  areaUnit: string;
  price: string;
  status: string;
  description: string;
  lat: string;
  lng: string;
}

export const emptyPropertyForm = (status = 'available'): PropertyFormValues => ({
  name: '',
  propertyNumber: '',
  areaValue: '',
  areaUnit: 'acre',
  price: '',
  status,
  description: '',
  lat: '',
  lng: '',
});

interface PropertyFormModalProps {
  open: boolean;
  propertyType: Extract<PropertyType, 'farm' | 'land'>;
  editingProperty?: Property | null;
  token: string;
  onClose: () => void;
  onSaved: () => void;
}

export default function PropertyFormModal({
  open,
  propertyType,
  editingProperty,
  token,
  onClose,
  onSaved,
}: PropertyFormModalProps) {
  const { t } = useLocale();
  const { saleStatuses } = usePropertyStatusConfig();
  const [form, setForm] = useState<PropertyFormValues>(emptyPropertyForm());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editingProperty) {
      setForm({
        name: editingProperty.name || '',
        propertyNumber: editingProperty.propertyNumber || '',
        areaValue: editingProperty.area?.value != null ? String(editingProperty.area.value) : '',
        areaUnit: editingProperty.area?.unit || 'acre',
        price: editingProperty.price != null ? String(editingProperty.price) : '',
        status: editingProperty.status || 'available',
        description: editingProperty.description || '',
        lat: editingProperty.latitude != null ? String(editingProperty.latitude) : '',
        lng: editingProperty.longitude != null ? String(editingProperty.longitude) : '',
      });
    } else {
      setForm(emptyPropertyForm(saleStatuses[0]?.key || 'available'));
    }
  }, [open, editingProperty, saleStatuses]);

  if (!open) return null;

  const typeLabel =
    propertyType === 'farm' ? t('property.type.farm') : t('property.type.land');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const areaValue = Number(form.areaValue);
    const lat = Number(form.lat);
    const lng = Number(form.lng);

    if (!form.name.trim() || !form.propertyNumber.trim()) {
      notify.error(t('propertyForm.requiredFields'));
      return;
    }
    if (Number.isNaN(areaValue) || areaValue < 0) {
      notify.error(t('propertyForm.invalidArea'));
      return;
    }
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      notify.error(t('propertyForm.invalidCoords'));
      return;
    }

    const payload = {
      propertyType,
      name: form.name.trim(),
      propertyNumber: form.propertyNumber.trim(),
      area: { value: areaValue, unit: form.areaUnit },
      price: form.price === '' ? null : Number(form.price),
      status: form.status,
      description: form.description.trim(),
      latitude: lat,
      longitude: lng,
    };

    setSaving(true);
    try {
      if (editingProperty?._id) {
        await updateProperty(editingProperty._id, payload, token);
        notify.success(t('propertyForm.updated'));
      } else {
        await createProperty(payload, token);
        notify.success(t('propertyForm.created'));
      }
      onClose();
      onSaved();
    } catch (err: unknown) {
      notify.error(getApiErrorMessage(err, t('propertyForm.saveFailed')));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <form onSubmit={handleSubmit} className="modal-panel-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold text-gray-900">
          {editingProperty
            ? t('propertyForm.editTitle', { type: typeLabel })
            : t('propertyForm.addTitle', { type: typeLabel })}
        </h2>

        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              {t('propertyForm.name')}
            </label>
            <input
              className="input-field"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              {t('propertyForm.number')}
            </label>
            <input
              className="input-field"
              value={form.propertyNumber}
              onChange={(e) => setForm({ ...form, propertyNumber: e.target.value })}
              required
            />
          </div>
          <div className="form-grid">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                {t('propertyForm.area')}
              </label>
              <input
                className="input-field"
                type="number"
                min="0"
                step="any"
                value={form.areaValue}
                onChange={(e) => setForm({ ...form, areaValue: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                {t('propertyForm.unit')}
              </label>
              <select
                className="input-field"
                value={form.areaUnit}
                onChange={(e) => setForm({ ...form, areaUnit: e.target.value })}
              >
                {AREA_UNITS.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-grid">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                {t('propertyForm.price')}
              </label>
              <input
                className="input-field"
                type="number"
                min="0"
                step="any"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                {t('propertyForm.status')}
              </label>
              <select
                className="input-field"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                {saleStatuses.map((status) => (
                  <option key={status.key} value={status.key}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-grid">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                {t('layoutForm.latitude')}
              </label>
              <input
                className="input-field"
                type="number"
                step="any"
                value={form.lat}
                onChange={(e) => setForm({ ...form, lat: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                {t('layoutForm.longitude')}
              </label>
              <input
                className="input-field"
                type="number"
                step="any"
                value={form.lng}
                onChange={(e) => setForm({ ...form, lng: e.target.value })}
                required
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              {t('propertyForm.description')}
            </label>
            <textarea
              className="input-field min-h-[80px]"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
        </div>

        <div className="btn-stack mt-4">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">
            {t('common.cancel')}
          </button>
          <button type="submit" disabled={saving} className="btn-primary flex-1">
            {saving ? t('propertyForm.saving') : t('common.save')}
          </button>
        </div>
      </form>
    </div>
  );
}
