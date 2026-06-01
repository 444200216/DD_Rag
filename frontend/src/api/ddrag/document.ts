import type { DocumentItem, DocumentListQuery, DocumentPreview } from '@/types/ddrag'
import { ddragGet, ddragPost, ddragDelete } from '@/utils/http/ddrag'

export async function fetchDocuments(query?: DocumentListQuery): Promise<DocumentItem[]> {
  return ddragGet<DocumentItem[]>('/documents', query as Record<string, unknown>)
}

export async function uploadDocumentSimple(groupId: number, file: File): Promise<number> {
  const formData = new FormData()
  formData.append('groupId', String(groupId))
  formData.append('file', file)
  return ddragPost<number>('/documents/upload', formData)
}

export async function fetchDocumentPreview(documentId: number, groupId: number): Promise<DocumentPreview> {
  return ddragGet<DocumentPreview>(`/documents/${documentId}/preview`, { groupId })
}

export async function deleteDocument(documentId: number, groupId: number): Promise<void> {
  await ddragDelete<void>(`/documents/${documentId}`, { groupId })
}

export async function retryDocumentIngestion(documentId: number, groupId: number): Promise<void> {
  await ddragPost<void>(`/documents/${documentId}/retry-ingestion`, undefined, { groupId })
}