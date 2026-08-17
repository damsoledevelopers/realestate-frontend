'use client';

import { useState } from 'react';
import { FolderPlus, Search, Upload } from 'lucide-react';

interface DocumentToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  onCreateFolder: (name: string) => Promise<void>;
  onUploadClick: () => void;
  creating?: boolean;
  canManage?: boolean;
}

export default function DocumentToolbar({
  search,
  onSearchChange,
  onCreateFolder,
  onUploadClick,
  creating = false,
  canManage = true,
}: DocumentToolbarProps) {
  const [folderName, setFolderName] = useState('');
  const [showFolderInput, setShowFolderInput] = useState(false);

  const handleCreate = async () => {
    const name = folderName.trim();
    if (!name) return;
    await onCreateFolder(name);
    setFolderName('');
    setShowFolderInput(false);
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative min-w-0 flex-1 sm:max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search files and folders..."
          className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {canManage && (
          <>
        {showFolderInput ? (
          <div className="flex items-center gap-2">
            <input
              autoFocus
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate();
                if (e.key === 'Escape') setShowFolderInput(false);
              }}
              placeholder="Folder name"
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
            <button
              type="button"
              disabled={creating || !folderName.trim()}
              onClick={handleCreate}
              className="btn-primary text-xs"
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => setShowFolderInput(false)}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowFolderInput(true)}
            className="btn-secondary inline-flex items-center gap-2 text-xs"
          >
            <FolderPlus className="h-4 w-4" />
            New Folder
          </button>
        )}
        <button
          type="button"
          onClick={onUploadClick}
          className="btn-primary inline-flex items-center gap-2 text-xs"
        >
          <Upload className="h-4 w-4" />
          Upload Files
        </button>
          </>
        )}
      </div>
    </div>
  );
}
