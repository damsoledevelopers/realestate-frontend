'use client';

import PropertyTypeManagementView from '@/components/dashboard/PropertyTypeManagementView';

export default function FarmsPage() {
  return (
    <PropertyTypeManagementView
      propertyType="farm"
      titleKey="dashboard.farms.title"
      subtitleKey="dashboard.farms.subtitle"
      addKey="dashboard.farms.add"
      emptyKey="dashboard.farms.empty"
    />
  );
}
