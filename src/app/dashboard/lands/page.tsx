'use client';

import PropertyTypeManagementView from '@/components/dashboard/PropertyTypeManagementView';

export default function LandsPage() {
  return (
    <PropertyTypeManagementView
      propertyType="land"
      titleKey="dashboard.lands.title"
      subtitleKey="dashboard.lands.subtitle"
      addKey="dashboard.lands.add"
      emptyKey="dashboard.lands.empty"
    />
  );
}
