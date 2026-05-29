import type { DocumentItem, DocumentListQuery, DocumentPreview } from '@/types/ddrag'

const mockDocuments: DocumentItem[] = [
  { documentId: 1, groupId: 1, fileName: '产品需求文档v2.pdf', fileExt: '.pdf', contentType: 'application/pdf', fileSize: 2457600, status: 'COMPLETED', failureReason: null, uploadedAt: '2026-05-20T10:30:00', uploaderUserId: 1, uploaderDisplayName: '张锋' },
  { documentId: 2, groupId: 1, fileName: '技术架构设计.docx', fileExt: '.docx', contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', fileSize: 1536000, status: 'COMPLETED', failureReason: null, uploadedAt: '2026-05-21T14:00:00', uploaderUserId: 5, uploaderDisplayName: '李明' },
  { documentId: 3, groupId: 1, fileName: 'API接口规范.md', fileExt: '.md', contentType: 'text/markdown', fileSize: 51200, status: 'COMPLETED', failureReason: null, uploadedAt: '2026-05-22T09:15:00', uploaderUserId: 1, uploaderDisplayName: '张锋' },
  { documentId: 4, groupId: 2, fileName: '用户手册.pdf', fileExt: '.pdf', contentType: 'application/pdf', fileSize: 819200, status: 'PROCESSING', failureReason: null, uploadedAt: '2026-05-28T16:00:00', uploaderUserId: 8, uploaderDisplayName: '王芳' },
  { documentId: 5, groupId: 2, fileName: '竞品分析报告.pdf', fileExt: '.pdf', contentType: 'application/pdf', fileSize: 3072000, status: 'PENDING', failureReason: null, uploadedAt: '2026-05-29T08:00:00', uploaderUserId: 1, uploaderDisplayName: '张锋' },
  { documentId: 6, groupId: 3, fileName: '测试用例集.xlsx', fileExt: '.xlsx', contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', fileSize: 256000, status: 'COMPLETED', failureReason: null, uploadedAt: '2026-05-15T11:30:00', uploaderUserId: 5, uploaderDisplayName: '李明' },
  { documentId: 7, groupId: 1, fileName: '部署运维手册.txt', fileExt: '.txt', contentType: 'text/plain', fileSize: 10240, status: 'FAILED', failureReason: '文件解析失败：不支持的编码格式', uploadedAt: '2026-05-23T15:00:00', uploaderUserId: 1, uploaderDisplayName: '张锋' },
  { documentId: 8, groupId: 3, fileName: '性能测试报告.pdf', fileExt: '.pdf', contentType: 'application/pdf', fileSize: 409600, status: 'COMPLETED', failureReason: null, uploadedAt: '2026-05-25T10:00:00', uploaderUserId: 8, uploaderDisplayName: '王芳' },
]

export async function fetchDocuments(query?: DocumentListQuery): Promise<DocumentItem[]> {
  await delay(200)
  let result = [...mockDocuments]
  if (query?.groupId) result = result.filter((d) => d.groupId === query.groupId)
  if (query?.status) result = result.filter((d) => d.status === query.status)
  return result
}

export async function fetchDocumentPreview(documentId: number, _groupId: number): Promise<DocumentPreview> {
  await delay(200)
  const doc = mockDocuments.find((d) => d.documentId === documentId)
  return {
    documentId,
    groupId: doc?.groupId ?? 1,
    fileName: doc?.fileName ?? '未知文档',
    previewText: '这是文档的预览内容。在实际系统中，这里会显示从知识库中提取的文档文本片段。本页面仅为设计演示阶段，使用模拟数据。',
    status: doc?.status ?? null,
  }
}

export async function deleteDocument(_documentId: number, _groupId: number): Promise<void> {
  await delay(300)
}

export async function retryDocumentIngestion(_documentId: number, _groupId: number): Promise<void> {
  await delay(300)
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}