import { getApiBaseUrl } from '@/lib/apiBase';

export interface DocumentUserRef {
  id: string;
  name: string;
  email?: string;
}

export interface DocumentLayoutRef {
  id: string;
  name: string;
  nameMr?: string;
}

export interface LayoutDocumentFolder {
  id: string;
  layoutId: string | null;
  layout: DocumentLayoutRef | null;
  parentId: string | null;
  name: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type CompanyDocumentCategory =
  | 'layout_brochure'
  | '7_12_extract'
  | 'measurement_map'
  | 'approval_documents'
  | 'authority_documents'
  | 'plot_certificate'
  | 'other_documents';

export const COMPANY_DOCUMENT_CATEGORIES: CompanyDocumentCategory[] = [
  'layout_brochure',
  '7_12_extract',
  'measurement_map',
  'approval_documents',
  'authority_documents',
  'plot_certificate',
  'other_documents',
];

export const PLOT_CERTIFICATE_CATEGORIES: CompanyDocumentCategory[] = [
  'plot_certificate',
  'authority_documents',
];

export function getCompanyDocumentCategoryLabel(
  category: CompanyDocumentCategory,
  t: (key: string) => string
): string {
  return t(`companyDocuments.category.${category}`);
}

export interface CompanyDocumentFile extends LayoutDocumentFile {
  kind: 'company';
  category: CompanyDocumentCategory;
  plotId?: string | null;
}

export interface CompanyDocumentsResponse {
  documents: CompanyDocumentFile[];
  layoutId: string;
  plotId?: string | null;
  category: CompanyDocumentCategory | null;
  search: string;
}

export function getCompanyDocumentDownloadUrl(layoutId: string, fileId: string): string {
  return `${getApiBaseUrl()}/layouts/${layoutId}/company-documents/${fileId}/download`;
}

export interface LayoutDocumentFile {
  id: string;
  kind?: 'personal' | 'company';
  category?: CompanyDocumentCategory | null;
  layoutId: string | null;
  layout: DocumentLayoutRef | null;
  folderId: string | null;
  name: string;
  originalName: string;
  fileUrl: string;
  mimeType: string;
  fileSize: number;
  extension: string;
  uploadedBy: DocumentUserRef | null;
  lastModifiedBy: DocumentUserRef | null;
  createdAt: string;
  updatedAt: string;
  previewable?: boolean;
}

export interface DocumentBreadcrumbItem {
  id: string | null;
  name: string;
}

export interface LayoutDocumentsResponse {
  folders: LayoutDocumentFolder[];
  files: LayoutDocumentFile[];
  breadcrumb: DocumentBreadcrumbItem[];
  search: string;
  layoutId: string | null;
}

export const DOCUMENT_ACCEPT =
  '.pdf,.doc,.docx,.xls,.xlsx,.dwg,.dxf,.jpg,.jpeg,.png,.webp,.zip,.rar,.txt,.csv,.ppt,.pptx';

export function formatFileSize(bytes: number): string {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** i;
  return `${value.toFixed(value >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

export function getFileIconType(mimeType: string, extension: string): 'image' | 'pdf' | 'sheet' | 'doc' | 'cad' | 'archive' | 'other' {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType === 'application/pdf' || extension === '.pdf') return 'pdf';
  if (extension === '.xls' || extension === '.xlsx' || mimeType.includes('spreadsheet') || mimeType.includes('excel')) {
    return 'sheet';
  }
  if (extension === '.doc' || extension === '.docx' || mimeType.includes('word')) return 'doc';
  if (extension === '.dwg' || extension === '.dxf') return 'cad';
  if (extension === '.zip' || extension === '.rar') return 'archive';
  return 'other';
}

export function isPreviewableFile(mimeType: string): boolean {
  return mimeType.startsWith('image/') || mimeType === 'application/pdf';
}

export function getDocumentDownloadUrl(fileId: string): string {
  return `${getApiBaseUrl()}/documents/files/${fileId}/download`;
}
