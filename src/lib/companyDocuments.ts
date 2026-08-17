import { api } from '@/lib/api';
import {
  CompanyDocumentCategory,
  CompanyDocumentFile,
  CompanyDocumentsResponse,
} from '@/lib/documents';

export function fetchCompanyDocuments(
  layoutId: string,
  token: string,
  params?: { category?: CompanyDocumentCategory; search?: string; plotId?: string }
) {
  const searchParams = new URLSearchParams();
  if (params?.category) searchParams.set('category', params.category);
  if (params?.search?.trim()) searchParams.set('search', params.search.trim());
  if (params?.plotId) searchParams.set('plotId', params.plotId);
  const query = searchParams.toString();
  return api.get<CompanyDocumentsResponse>(
    `/layouts/${layoutId}/company-documents${query ? `?${query}` : ''}`,
    token
  );
}

export function uploadCompanyDocuments(
  layoutId: string,
  token: string,
  payload: { category: CompanyDocumentCategory; files: File[]; plotId?: string }
) {
  const formData = new FormData();
  formData.append('category', payload.category);
  if (payload.plotId) formData.append('plotId', payload.plotId);
  payload.files.forEach((file) => formData.append('files', file));
  return api.postForm<{ documents: CompanyDocumentFile[] }>(
    `/layouts/${layoutId}/company-documents`,
    formData,
    token
  );
}

export function updateCompanyDocument(
  layoutId: string,
  fileId: string,
  token: string,
  body: { name?: string; category?: CompanyDocumentCategory }
) {
  return api.patch<CompanyDocumentFile>(
    `/layouts/${layoutId}/company-documents/${fileId}`,
    body,
    token
  );
}

export function replaceCompanyDocument(layoutId: string, fileId: string, token: string, file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return api.putForm<CompanyDocumentFile>(
    `/layouts/${layoutId}/company-documents/${fileId}/replace`,
    formData,
    token
  );
}

export function deleteCompanyDocument(layoutId: string, fileId: string, token: string) {
  return api.delete(`/layouts/${layoutId}/company-documents/${fileId}`, token);
}
