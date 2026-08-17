'use client';

import { ChevronRight, Home } from 'lucide-react';
import type { DocumentBreadcrumbItem } from '@/lib/documents';

interface FolderBreadcrumbProps {
  items: DocumentBreadcrumbItem[];
  onNavigate: (folderId: string | null) => void;
}

export default function FolderBreadcrumb({ items, onNavigate }: FolderBreadcrumbProps) {
  return (
    <nav aria-label="Folder breadcrumb" className="flex flex-wrap items-center gap-1 text-sm">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <div key={`${item.id ?? 'root'}-${index}`} className="flex items-center gap-1">
            {index > 0 && <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" />}
            <button
              type="button"
              disabled={isLast}
              onClick={() => onNavigate(item.id)}
              className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 transition ${
                isLast
                  ? 'cursor-default font-medium text-gray-900'
                  : 'text-primary-600 hover:bg-primary-50'
              }`}
            >
              {index === 0 && <Home className="h-3.5 w-3.5" />}
              {item.name}
            </button>
          </div>
        );
      })}
    </nav>
  );
}
