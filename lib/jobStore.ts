// In-memory job store — works for single-instance (local dev + single Vercel instance)
// For multi-instance production, replace with Supabase table

import type { BuildReport } from './ai/generator'

export type JobStatus = 'pending' | 'done' | 'error'

export interface Job {
  status: JobStatus
  message?: string        // Live phase label shown during generation
  clientId?: string
  slug?: string
  demoUrl?: string
  altDemoUrl?: string   // variant B demo URL when variants requested
  altSlug?: string
  businessName?: string
  vertical?: string
  error?: string
  createdAt: number
  // Cost tracking
  inputTokens?: number
  outputTokens?: number
  costUsd?: number
  truncated?: boolean         // true if HTML was cut off at max_tokens limit
  validationWarning?: string  // set when post-generation checks detect a quality issue
  aiValidationIssues?: string[]  // issues found by Haiku AI post-audit
  // Prompt-cache stats (Claude only)
  cacheReadTokens?: number
  cacheWriteTokens?: number
  // Build report — shown in admin UI after generation
  buildReport?: BuildReport
  // Structured error log — populated when status==='error', copiable for debugging
  errorLog?: string
}

const store = new Map<string, Job>()

// Clean jobs older than 30 minutes
function cleanup() {
  const cutoff = Date.now() - 30 * 60 * 1000
  for (const [id, job] of store) {
    if (job.createdAt < cutoff) store.delete(id)
  }
}

export const jobStore = {
  create(id: string): void {
    cleanup()
    store.set(id, { status: 'pending', createdAt: Date.now() })
  },
  update(id: string, data: Partial<Job>): void {
    const job = store.get(id)
    if (job) store.set(id, { ...job, ...data })
  },
  get(id: string): Job | undefined {
    return store.get(id)
  },
}
