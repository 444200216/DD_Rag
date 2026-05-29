import type { AskQuestionPayload, AskQuestionResponse, CitationItem } from '@/types/ddrag'

const mockCitations: CitationItem[] = [
  { documentId: 1, chunkId: 101, chunkIndex: 3, fileName: '产品需求文档v2.pdf', score: 0.92, snippet: '系统应支持用户创建和加入知识组，在组内上传文档并进行基于知识库的问答...' },
  { documentId: 2, chunkId: 201, chunkIndex: 7, fileName: '技术架构设计.docx', score: 0.85, snippet: '采用混合检索策略，结合PgVector语义检索和Elasticsearch BM25关键词检索...' },
  { documentId: 3, chunkId: 301, chunkIndex: 2, fileName: 'API接口规范.md', score: 0.78, snippet: 'QA接口支持单轮问答，请求参数包括groupId和question，返回答案和引用...' },
]

export async function askQuestion(payload: AskQuestionPayload): Promise<AskQuestionResponse> {
  await delay(800)
  if (payload.question.includes('不存在') || payload.question.includes('没有')) {
    return {
      answered: false,
      answer: null,
      reasonCode: 'INSUFFICIENT_EVIDENCE',
      reasonMessage: '知识库中没有找到与您的问题相关的文档内容，无法给出可靠的回答。',
      citations: [],
    }
  }
  return {
    answered: true,
    answer: `根据知识库中的相关文档，关于"${payload.question}"的回答如下：\n\n系统采用混合检索策略，结合语义检索和关键词检索来提高召回率。所有检索和问答操作均在组级隔离范围内进行，确保不同组之间的数据不会泄露。\n\n具体的检索流程包括：查询规划（DIRECT/REWRITE/DECOMPOSE）、混合检索+RRF融合、证据级别门控等步骤。`,
    reasonCode: null,
    reasonMessage: null,
    citations: mockCitations,
  }
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}