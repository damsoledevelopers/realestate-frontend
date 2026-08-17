'use client';

import { Folder, Pencil, Trash2 } from 'lucide-react';
import type { LayoutDocumentFolder } from '@/lib/documents';

interface FolderListProps {
  folders: LayoutDocumentFolder[];
  onOpen: (folderId: string) => void;
  onRename: (folder: LayoutDocumentFolder) => void;
  onDelete: (folder: LayoutDocumentFolder) => void;
  readOnly?: boolean;
}

export default function FolderList({ folders, onOpen, onRename, onDelete, readOnly = false }: FolderListProps) {
  if (!folders.length) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Folders</h4>
      <div className="grid gap-2 sm:grid-cols-2">
        {folders.map((folder) => (
          <div
            key={folder.id}
            className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm transition hover:border-primary-200 hover:shadow"
          >
            <button
              type="button"
              onClick={() => onOpen(folder.id)}
              className="flex min-w-0 flex-1 items-center gap-3 text-left"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <Folder className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-900">{folder.name}</p>
                <p className="text-xs text-gray-500">Folder</p>
              </div>
            </button>
            {!readOnly && (
            <div className="flex shrink-0 items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
              <button
                type="button"
                onClick={() => onRename(folder)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-primary-600"
                aria-label={`Rename ${folder.name}`}
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => onDelete(folder)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                aria-label={`Delete ${folder.name}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
