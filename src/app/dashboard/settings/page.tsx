'use client';

import { useLocale } from '@/context/LocaleContext';
import PropertyStatusColorEditor from '@/components/property/PropertyStatusColorEditor';

export default function AdminSettingsPage() {
  const { t } = useLocale();

  return (
    <div className="dashboard-page space-y-6">
      <div className="page-header">
        <div>
          <h2 className="page-header-title">{t('dashboard.settings.title')}</h2>
          <p className="page-header-subtitle">{t('dashboard.settings.subtitle')}</p>
        </div>
      </div>

      <PropertyStatusColorEditor />
    </div>
  );
}
