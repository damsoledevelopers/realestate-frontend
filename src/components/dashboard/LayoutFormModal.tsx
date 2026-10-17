'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Layout } from '@/lib/types';
import { notify } from '@/lib/notify';
import { getLayoutImages, MAX_LAYOUT_IMAGES } from '@/lib/layoutImages';
import { resolveMediaUrls } from '@/lib/media';
import { useLocale } from '@/context/LocaleContext';
import { getLocalizedLocation } from '@/lib/localizedText';
import { useLayouts } from '@/hooks/useLayouts';
import { getDependentLocationOptions } from '@/lib/layoutFilters';

export const emptyLayoutForm = {
  name: '',
  description: '',
  location: '',
  contactEmail: '', contactNumber: '', downloadLink: '',
  state: '', district: '', taluka: '', village: '', surveyNumber: '', amenitiesText: '',
  lat: '',
  lng: '',
  status: 'active' as 'active' | 'inactive',
  showSitePlan: true,
};

// Public ArcGIS administrative village directory. It exposes state, district,
// subdistrict (taluka/tehsil) and village names, queried one level at a time.
const ADD_LAYOUT_DISTRICTS = ['Dhule', 'Jalgaon', 'Nandurbar'] as const;
const INDIA_LOCATION_QUERY_URL =
  'https://livingatlas.esri.in/server/rest/services/IAB2024/Village_Demographics_2024/MapServer/0/query';

type LocationLevel = 'district' | 'subdistrict' | 'name';

function escapeSqlValue(value: string): string {
  return value.replace(/'/g, "''");
}

async function fetchIndiaLocationOptions(
  field: LocationLevel,
  filters: Array<{ field: 'state' | 'district' | 'subdistrict'; value: string }>,
  signal: AbortSignal,
): Promise<string[]> {
  const where = filters
    .filter((item) => item.value.trim())
    .map((item) => `${item.field} = '${escapeSqlValue(item.value.trim())}'`)
    .join(' AND ') || '1=1';
  const values = new Set<string>();
  let resultOffset = 0;
  const pageSize = 2000;

  // Some districts have many villages, so page through the service instead of
  // silently showing only the first 2,000 results.
  while (true) {
    const params = new URLSearchParams({
      where,
      outFields: field,
      returnDistinctValues: 'true',
      returnGeometry: 'false',
      orderByFields: field,
      resultRecordCount: String(pageSize),
      resultOffset: String(resultOffset),
      f: 'json',
    });
    const response = await fetch(`${INDIA_LOCATION_QUERY_URL}?${params.toString()}`, { signal });
    if (!response.ok) throw new Error(`Location directory request failed (${response.status})`);
    const payload = await response.json() as {
      error?: { message?: string };
      features?: Array<{ attributes?: Record<string, unknown> }>;
    };
    if (payload.error) throw new Error(payload.error.message || 'Location directory returned an error');
    const rows = payload.features || [];
    for (const row of rows) {
      const raw = row.attributes?.[field];
      if (typeof raw === 'string' && raw.trim()) values.add(raw.trim());
    }
    if (rows.length < pageSize) break;
    resultOffset += rows.length;
    if (resultOffset > 100000) break; // Defensive guard against a broken service response.
  }
  return Array.from(values).sort((a, b) => a.localeCompare(b));
}

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
  const { t, locale } = useLocale();
  const { data: locationLayouts = [] } = useLayouts('all');
  const [layoutForm, setLayoutForm] = useState(emptyLayoutForm);
  const [districtMaster, setDistrictMaster] = useState<string[]>([]);
  const [talukaMaster, setTalukaMaster] = useState<string[]>([]);
  const [villageMaster, setVillageMaster] = useState<string[]>([]);

  // Fetch every district for the selected state, then the talukas for the
  // selected district, then villages for the selected taluka. Each request is
  // cancelled when the parent selection changes to avoid stale options.
  useEffect(() => {
    const controller = new AbortController();
    setDistrictMaster([]);
    setTalukaMaster([]);
    setVillageMaster([]);
    if (layoutForm.state) {
      fetchIndiaLocationOptions('district', [{ field: 'state', value: layoutForm.state }], controller.signal)
        .then(setDistrictMaster)
        .catch((error: unknown) => {
          if (!(error instanceof DOMException && error.name === 'AbortError')) setDistrictMaster([]);
        });
    }
    return () => controller.abort();
  }, [layoutForm.state]);

  useEffect(() => {
    const controller = new AbortController();
    setTalukaMaster([]);
    setVillageMaster([]);
    if (layoutForm.state && layoutForm.district) {
      fetchIndiaLocationOptions('subdistrict', [
        { field: 'state', value: layoutForm.state },
        { field: 'district', value: layoutForm.district },
      ], controller.signal)
        .then(setTalukaMaster)
        .catch((error: unknown) => {
          if (!(error instanceof DOMException && error.name === 'AbortError')) setTalukaMaster([]);
        });
    }
    return () => controller.abort();
  }, [layoutForm.state, layoutForm.district]);

  useEffect(() => {
    const controller = new AbortController();
    setVillageMaster([]);
    if (layoutForm.state && layoutForm.district && layoutForm.taluka) {
      fetchIndiaLocationOptions('name', [
        { field: 'state', value: layoutForm.state },
        { field: 'district', value: layoutForm.district },
        { field: 'subdistrict', value: layoutForm.taluka },
      ], controller.signal)
        .then(setVillageMaster)
        .catch((error: unknown) => {
          if (!(error instanceof DOMException && error.name === 'AbortError')) setVillageMaster([]);
        });
    }
    return () => controller.abort();
  }, [layoutForm.state, layoutForm.district, layoutForm.taluka]);

  const districts = layoutForm.state === 'Maharashtra'
    ? [...ADD_LAYOUT_DISTRICTS]
    : [];
  const savedTalukas = getDependentLocationOptions(locationLayouts, 'taluka', { state: layoutForm.state, district: layoutForm.district });
  const talukas = Array.from(new Set([...talukaMaster, ...savedTalukas, ...(layoutForm.taluka ? [layoutForm.taluka] : [])]))
    .sort((a, b) => a.localeCompare(b));
  const savedVillages = getDependentLocationOptions(locationLayouts, 'village', { state: layoutForm.state, district: layoutForm.district, taluka: layoutForm.taluka });
  const villages = Array.from(new Set([...villageMaster, ...savedVillages, ...(layoutForm.village ? [layoutForm.village] : [])]))
    .sort((a, b) => a.localeCompare(b));
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [hiddenImages, setHiddenImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const [hiddenNewImagePreviews, setHiddenNewImagePreviews] = useState<string[]>([]);
  const [qrImage, setQrImage] = useState<File | null>(null);
  const [layoutFile, setLayoutFile] = useState<File | null>(null);
  const [pdfFiles, setPdfFiles] = useState<File[]>([]);
  const [pdfVisibility, setPdfVisibility] = useState<boolean[]>([]);
  const [documents, setDocuments] = useState<Array<{ name: string; url: string; visible: boolean; mimeType?: string }>>([]);
  const [savingLayout, setSavingLayout] = useState(false);
  const [amenities, setAmenities] = useState<Array<{ name: string; visible: boolean }>>([]);
  const [amenityDraft, setAmenityDraft] = useState('');
  const commonAmenitySuggestions = [
    'Road Access', 'Water Supply', 'Electricity', 'Street Lights', 'Drainage', 'Garden', 'Security', "Children's Play Area", 'Clubhouse', 'Parking',
    'Gated Community', 'CCTV Surveillance', '24x7 Security', 'Compound Wall', 'Main Entrance Gate', 'Internal Concrete Roads',
    'Paved Footpaths', 'Rainwater Harvesting', 'Sewage Treatment Plant', 'Stormwater Drainage', 'Water Storage Tank',
    'Borewell', 'Municipal Water Connection', 'Solar Street Lights', 'Underground Electricity', 'Landscaped Garden',
    'Open Gym', 'Jogging Track', 'Walking Track', 'Yoga / Meditation Area', 'Fitness Centre', 'Swimming Pool',
    'Indoor Games Room', 'Outdoor Sports Area', 'Basketball Court', 'Badminton Court', 'Cricket Practice Net',
    'Multipurpose Court', 'Senior Citizens Seating', 'Community Hall', 'Party Lawn', 'Amphitheatre',
    'Kids Play Zone', 'Visitor Parking', 'Two-Wheeler Parking', 'EV Charging Point', 'Visitor Waiting Area',
    'Street Name Boards', 'Plot Boundary Markers', 'Surveyed Plots', 'Demarcated Plots', 'Corner Plot Options',
    'Wide Approach Road', 'Bus Stop Nearby', 'School Nearby', 'Hospital Nearby', 'Market Nearby', 'Public Transport Access',
    'Fire Safety Provisions', 'Disabled-Friendly Access', 'Waste Collection Point', 'Organic Waste Composting',
    'Rainwater Recharge Pit', 'Tree Plantation', 'Water Connection Provision', 'Electric Meter Provision',
    'High-Speed Internet Provision', 'Smart Street Lighting', 'Solar Power Provision', 'Maintenance Office',
    'Caretaker Room', 'Guest Parking', 'Cafeteria', 'Convenience Store', 'ATM Nearby', 'Temple / Prayer Area'
  ];
  const amenitySuggestions = Array.from(new Set([...commonAmenitySuggestions, ...amenities.map((item) => item.name)])).filter((name) => name.toLowerCase().includes(amenityDraft.trim().toLowerCase()) && !amenities.some((item) => item.name.toLowerCase() === name.toLowerCase()));
  const [attachments, setAttachments] = useState<Array<{ name: string; url: string; visible: boolean }>>([]);
  const [attachmentName, setAttachmentName] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');

  useEffect(() => {
    if (!open) return;
    if (initialLayout) {
      setLayoutForm({
        name: initialLayout.name,
        description: initialLayout.description || '',
        location: initialLayout.location,
        contactEmail: initialLayout.contactEmail || '', contactNumber: initialLayout.contactNumber || '', downloadLink: initialLayout.downloadLink || '',
        state: initialLayout.state || '', district: initialLayout.district || '', taluka: initialLayout.taluka || '', village: initialLayout.village || '', surveyNumber: initialLayout.surveyNumber || '', amenitiesText: (initialLayout.amenities || []).join(', '),
        lat: initialLayout.coordinates?.lat?.toString() || '',
        lng: initialLayout.coordinates?.lng?.toString() || '',
        status: initialLayout.status,
        showSitePlan: initialLayout.showSitePlan !== false,
      });
      setExistingImages(resolveMediaUrls(initialLayout.images?.length ? initialLayout.images : initialLayout.imageUrl ? [initialLayout.imageUrl] : []));
      setHiddenImages((initialLayout.hiddenImages || []).flatMap((url) => resolveMediaUrls([url])));
      const amenityNames = initialLayout.amenities || [];
      const visibleNames = initialLayout.visibleAmenities || amenityNames;
      setAmenities(amenityNames.map((name) => ({ name, visible: visibleNames.includes(name) })));
      setAttachments((initialLayout.attachments || []).map((item) => ({ ...item, visible: item.visible !== false })));
      setDocuments((initialLayout.documents || []).map((item) => ({ ...item, visible: item.visible !== false })));  
    } else {
      setLayoutForm({ ...emptyLayoutForm, state: 'Maharashtra' });
      setExistingImages([]);
      setHiddenImages([]);
      setAmenities([]);
      setAttachments([]);
      setDocuments([]);
    }
    setNewImages([]);
    setNewImagePreviews([]);
    setQrImage(null);
    setLayoutFile(null);
    setPdfFiles([]);
    setPdfVisibility([]);
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
    formData.append('contactEmail', layoutForm.contactEmail);
    formData.append('contactNumber', layoutForm.contactNumber);
    formData.append('downloadLink', layoutForm.downloadLink);
    formData.append('hiddenImages', JSON.stringify(hiddenImages));
    formData.append('documents', JSON.stringify(documents));
    pdfFiles.forEach((file) => formData.append('documents', file));
    formData.append('pdfVisibility', JSON.stringify(pdfVisibility));
    formData.append('state', layoutForm.state); formData.append('district', layoutForm.district); formData.append('taluka', layoutForm.taluka); formData.append('village', layoutForm.village); formData.append('surveyNumber', layoutForm.surveyNumber);
    // Persist the full amenity list plus the Super Admin's per-item public visibility choices.
    formData.append('amenities', JSON.stringify(amenities.map((item) => item.name.trim()).filter(Boolean)));
    formData.append('visibleAmenities', JSON.stringify(amenities.filter((item) => item.visible).map((item) => item.name.trim()).filter(Boolean)));
    // Persist all attachments and each attachment's Show/Hide checkbox state.
    formData.append('attachments', JSON.stringify(attachments.map((item) => ({ name: item.name.trim(), url: item.url.trim(), visible: item.visible })).filter((item) => item.name && item.url)));
    formData.append('status', layoutForm.status);
    formData.append('showSitePlan', String(layoutForm.showSitePlan));
    if (layoutForm.lat) formData.append('lat', layoutForm.lat);
    if (layoutForm.lng) formData.append('lng', layoutForm.lng);
    if (editingLayoutId) formData.append('keepImages', JSON.stringify(existingImages));
    newImages.forEach((file) => formData.append('images', file));
    if (qrImage) formData.append('qrImage', qrImage);
    if (layoutFile) formData.append('layoutFile', layoutFile);

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
      <form onSubmit={saveLayout} className="modal-panel modal-panel-lg">
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div><label className="mb-1 block text-xs font-medium text-gray-700">Contact email address</label><input type="email" className="input-field" value={layoutForm.contactEmail} onChange={(e) => setLayoutForm({ ...layoutForm, contactEmail: e.target.value })} placeholder="contact@example.com" /></div>
            <div><label className="mb-1 block text-xs font-medium text-gray-700">Contact number</label><input type="tel" className="input-field" value={layoutForm.contactNumber} onChange={(e) => setLayoutForm({ ...layoutForm, contactNumber: e.target.value })} placeholder="Enter contact number" /></div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Downloadable file link (optional)</label>
            <input type="url" className="input-field" value={layoutForm.downloadLink} onChange={(e) => setLayoutForm({ ...layoutForm, downloadLink: e.target.value })} placeholder="https://example.com/layout-brochure.pdf" />
            <p className="mt-1 text-xs text-gray-500">Add a direct URL to a brochure, layout plan, or other downloadable file. Visitors will see a Download File link.</p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">{t('filters.state')}</label>
              <select className="input-field" value={layoutForm.state || 'Maharashtra'} onChange={(e) => setLayoutForm({ ...layoutForm, state: e.target.value, district: '', taluka: '', village: '' })}>
                <option value="Maharashtra">{getLocalizedLocation("Maharashtra", locale)}</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">{t('filters.district')}</label>
              <select className="input-field" value={layoutForm.district} disabled={!layoutForm.state} onChange={(e) => setLayoutForm({ ...layoutForm, district: e.target.value, taluka: '', village: '' })}>
                <option value="">{t('filters.selectDistrict')}</option>{districts.map((item) => <option key={item} value={item}>{getLocalizedLocation(item, locale)}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">{t('filters.taluka')}</label>
              <select className="input-field" value={layoutForm.taluka} disabled={!layoutForm.district} onChange={(e) => setLayoutForm({ ...layoutForm, taluka: e.target.value, village: '' })}>
                <option value="">{t('filters.selectTaluka')}</option>{talukas.map((item) => <option key={item} value={item}>{getLocalizedLocation(item, locale)}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">{t('filters.village')}</label>
              <select className="input-field" value={layoutForm.village} disabled={!layoutForm.taluka} onChange={(e) => setLayoutForm({ ...layoutForm, village: e.target.value })}>
                <option value="">{t('filters.selectVillage')}</option>{villages.map((item) => <option key={item} value={item}>{getLocalizedLocation(item, locale)}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Survey / Gat Number</label>
              <input className="input-field" value={layoutForm.surveyNumber} onChange={(e) => setLayoutForm({ ...layoutForm, surveyNumber: e.target.value })} placeholder="Enter survey / gat number" />
            </div>
          </div>
          <section className="rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-900">Amenities</h3>
            <p className="mt-1 text-xs text-gray-500">Type an amenity and press Enter or Add. Only checked items appear on the public website.</p>
            <div className="mt-3 flex gap-2"><input className="input-field min-w-0 flex-1" value={amenityDraft} onChange={(e) => setAmenityDraft(e.target.value)} placeholder="Type an amenity…" aria-autocomplete="list" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); const name = amenityDraft.trim(); if (name && !amenities.some((a) => a.name.toLowerCase() === name.toLowerCase())) setAmenities((prev) => [...prev, { name, visible: true }]); setAmenityDraft(''); } }} /><button type="button" className="btn-secondary shrink-0" onClick={() => { const name = amenityDraft.trim(); if (name && !amenities.some((a) => a.name.toLowerCase() === name.toLowerCase())) setAmenities((prev) => [...prev, { name, visible: true }]); setAmenityDraft(''); }}>Add</button></div>
            {amenityDraft.trim() && amenitySuggestions.length > 0 && <div className="mt-2 rounded-lg border border-gray-200 bg-white p-2 shadow-sm" role="listbox" aria-label="Amenity suggestions"><p className="px-2 pb-1 text-xs text-gray-500">Suggestions</p><div className="flex flex-wrap gap-2">{amenitySuggestions.slice(0, 8).map((name) => <button type="button" key={name} className="rounded-full border border-gray-200 px-3 py-1.5 text-xs hover:border-primary-500 hover:bg-primary-50" onClick={() => { if (!amenities.some((a) => a.name.toLowerCase() === name.toLowerCase())) setAmenities((prev) => [...prev, { name, visible: true }]); setAmenityDraft(''); }}>{name}</button>)}</div></div>}
            <div className="mt-3 space-y-2">{amenities.map((item) => <div key={item.name} className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 px-3 py-2"><label className="flex min-w-0 items-center gap-2 text-sm"><input type="checkbox" checked={item.visible} onChange={(e) => setAmenities((prev) => prev.map((a) => a.name === item.name ? { ...a, visible: e.target.checked } : a))} /><span className="break-words">{item.name}</span></label><button type="button" className="text-xs text-red-600" onClick={() => setAmenities((prev) => prev.filter((a) => a.name !== item.name))}>{t('common.remove')}</button></div>)}</div>
          </section>
          <section className="rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-900">Attachments / Documents</h3>
            
            <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
              <input className="input-field" value={attachmentName} onChange={(e) => setAttachmentName(e.target.value)} placeholder="Document name" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); const name = attachmentName.trim(), url = attachmentUrl.trim(); if (name && url) { setAttachments((prev) => [...prev, { name, url, visible: true }]); setAttachmentName(''); setAttachmentUrl(''); } } }} />
              <input className="input-field" value={attachmentUrl} onChange={(e) => setAttachmentUrl(e.target.value)} placeholder="https://... document URL" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); const name = attachmentName.trim(), url = attachmentUrl.trim(); if (name && url) { setAttachments((prev) => [...prev, { name, url, visible: true }]); setAttachmentName(''); setAttachmentUrl(''); } } }} />
            </div>
            <button type="button" className="btn-secondary mt-2" onClick={() => { const name = attachmentName.trim(), url = attachmentUrl.trim(); if (name && url) setAttachments((prev) => [...prev, { name, url, visible: true }]); setAttachmentName(''); setAttachmentUrl(''); }}>Add</button>
            <div className="mt-3 space-y-2">{attachments.map((item, index) => <div key={`${item.name}-${index}`} className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 px-3 py-2"><label className="flex min-w-0 items-center gap-2 text-sm"><input type="checkbox" checked={item.visible} onChange={(e) => setAttachments((prev) => prev.map((a, i) => i === index ? { ...a, visible: e.target.checked } : a))} /><span className="min-w-0"><span className="block break-words">{item.name}</span><span className="block break-all text-xs text-gray-500">{item.url}</span></span></label><button type="button" className="shrink-0 text-xs text-red-600" onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== index))}>{t('common.remove')}</button></div>)}</div>
          </section>
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
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-gray-900">Site Plan — Interactive Plot Map</p>
                <p className="mt-1 text-xs leading-5 text-gray-600">Show or hide the public section titled “Site Plan / Interactive Plot Map / Click any plot to view details and book.” This does not delete the layout or plot data.</p>
              </div>
              <label className="inline-flex shrink-0 cursor-pointer items-center gap-2 text-sm font-medium text-gray-800">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  checked={layoutForm.showSitePlan}
                  onChange={(e) => setLayoutForm({ ...layoutForm, showSitePlan: e.target.checked })}
                  aria-label="Show Site Plan Interactive Plot Map on public website"
                />
                {layoutForm.showSitePlan ? 'Show' : 'Hide'}
              </label>
            </div>
            <p className={`mt-2 text-xs font-medium ${layoutForm.showSitePlan ? 'text-emerald-700' : 'text-amber-700'}`}>
              {layoutForm.showSitePlan ? 'Visible to website visitors' : 'Hidden from website visitors'}
            </p>
          </div>
          <section className="rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-900">Layout Images</h3>
            <p className="mt-1 text-xs text-gray-500">Select images and PDF files together here. PDFs appear in this same section with individual Show/Hide checkboxes.</p>
            <input type="file" accept="image/*,.pdf,application/pdf" multiple className="input-field mt-3" onChange={(e) => { const selected = Array.from(e.target.files || []); const imageFiles = selected.filter((file) => file.type.startsWith('image/')); const selectedPdfs = selected.filter((file) => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')); if (imageFiles.length) addLayoutImages(imageFiles as unknown as FileList); if (selectedPdfs.length) setPdfFiles((prev) => [...prev, ...selectedPdfs].slice(0, 20)); setPdfVisibility((prev) => [...prev, ...selectedPdfs.map(() => true)].slice(0, 20)); e.target.value = ''; }} />
            {(existingImages.length > 0 || newImagePreviews.length > 0) ? <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{existingImages.map((url, index) => <div key={`existing-${url}-${index}`} className="overflow-hidden rounded-lg border border-gray-200 bg-white"><img src={url} alt={t('layoutForm.imageAlt', { index: index + 1 })} className="h-32 w-full object-cover" /><div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 bg-gray-50 p-3"><label className="flex min-w-0 cursor-pointer items-center gap-2 text-sm font-medium text-gray-800"><input aria-label={t('layoutForm.showImage', { index: index + 1 })} type="checkbox" className="!h-5 !w-5 shrink-0 cursor-pointer accent-blue-600" checked={!hiddenImages.includes(url)} onChange={(e) => setHiddenImages((prev) => e.target.checked ? prev.filter((item) => item !== url) : [...prev, url])} /><span>{hiddenImages.includes(url) ? t('layoutForm.hiddenFromWebsite') : t('layoutForm.showOnWebsite')}</span></label><button type="button" className="shrink-0 text-sm font-medium text-red-600" onClick={() => { setExistingImages((prev) => prev.filter((_, i) => i !== index)); setHiddenImages((prev) => prev.filter((item) => item !== url)); }}>{t('common.remove')}</button></div></div>)}{newImagePreviews.map((url, index) => <div key={`new-${url}`} className="overflow-hidden rounded-lg border border-gray-200 bg-white"><img src={url} alt={newImages[index]?.name || t('layoutForm.newImageAlt', { index: index + 1 })} className="h-32 w-full object-cover" /><div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 bg-gray-50 p-3"><label className="flex min-w-0 cursor-pointer items-center gap-2 text-sm font-medium text-gray-800"><input aria-label={t('layoutForm.showNewImage', { index: index + 1 })} type="checkbox" className="!h-5 !w-5 shrink-0 cursor-pointer accent-blue-600" checked={!hiddenNewImagePreviews.includes(url)} onChange={(e) => setHiddenNewImagePreviews((prev) => e.target.checked ? prev.filter((item) => item !== url) : [...prev, url])} /><span>{hiddenNewImagePreviews.includes(url) ? t('layoutForm.hiddenAfterSave') : t('layoutForm.showAfterSave')}</span></label><button type="button" className="shrink-0 text-sm font-medium text-red-600" onClick={() => { URL.revokeObjectURL(url); setNewImages((prev) => prev.filter((_, i) => i !== index)); setNewImagePreviews((prev) => prev.filter((_, i) => i !== index)); setHiddenNewImagePreviews((prev) => prev.filter((item) => item !== url)); }}>{t('common.remove')}</button></div></div>)}</div> : <p className="mt-3 rounded-lg bg-gray-50 p-3 text-xs text-gray-500">{t('layoutForm.noImages')}</p>}

            {pdfFiles.length > 0 || documents.length > 0 ? <div className="mt-4 border-t border-gray-200 pt-3"><h4 className="text-sm font-semibold text-gray-900">Uploaded PDFs</h4><p className="mt-1 text-xs text-gray-500">Toggle each saved PDF for public visibility.</p>{pdfFiles.map((file, index) => <div key={`${file.name}-${index}`} className="mt-2 flex items-center justify-between gap-3 rounded-lg bg-gray-50 px-3 py-2"><label className="flex min-w-0 items-center gap-2 text-sm"><input type="checkbox" checked={pdfVisibility[index] !== false} onChange={(e) => setPdfVisibility((prev) => prev.map((visible, i) => i === index ? e.target.checked : visible))} /><span className="break-all">{file.name} <span className="text-xs text-gray-500">(pending upload)</span></span></label><button type="button" className="shrink-0 text-xs text-red-600" onClick={() => { setPdfFiles((prev) => prev.filter((_, i) => i !== index)); setPdfVisibility((prev) => prev.filter((_, i) => i !== index)); }}>{t('common.remove')}</button></div>)}{documents.map((doc, index) => <div key={`${doc.url}-${index}`} className="mt-2 flex items-center justify-between gap-3 rounded-lg bg-gray-50 px-3 py-2"><label className="flex min-w-0 items-center gap-2 text-sm"><input type="checkbox" checked={doc.visible} onChange={(e) => setDocuments((prev) => prev.map((item, i) => i === index ? { ...item, visible: e.target.checked } : item))} /><a href={doc.url} target="_blank" rel="noreferrer" className="break-all text-blue-700 underline">{doc.name}</a></label><button type="button" className="shrink-0 text-xs text-red-600" onClick={() => setDocuments((prev) => prev.filter((_, i) => i !== index))}>{t('common.remove')}</button></div>)}</div> : null}
          </section>

          <div>
            <label className="mb-1 block text-xs font-medium">{t('layoutForm.layoutFile')}</label>
            <input
              type="file"
              accept=".xml,.aml,.kml,.dwg,.dxf,.json,.geojson,application/xml,text/xml,application/json"
              className="input-field"
              onChange={(e) => setLayoutFile(e.target.files?.[0] || null)}
            />
            <p className="mt-1 text-xs text-gray-500">
              {editingLayoutId
                ? 'Upload XML / AML / KML, AutoCAD DWG / DXF, JSON or GeoJSON. KML/XML/AML files are parsed for map geometry where supported; other formats are stored as downloadable files.'
                : t('layoutForm.layoutFileHint')}
            </p>
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
        {!editingLayoutId && <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">New layouts are saved as pending and will appear publicly only after Super Admin approval.</p>}
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
