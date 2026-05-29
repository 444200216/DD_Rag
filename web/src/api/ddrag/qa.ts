import type { AskQuestionPayload, AskQuestionResponse } from '@/types/ddrag'
import { ddragPost } from '@/utils/http/ddrag'

export async function askQuestion(payload: AskQuestionPayload): Promise<AskQuestionResponse> {
  return ddragPost<AskQuestionResponse>('/qa/ask', payload)
}