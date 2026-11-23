import { describe, expect, it } from 'vitest'
import { ApiError } from '../api/client'
import { shouldRetry } from './queryClient'

const apiError = (status: number) => new ApiError(status, { code: 'X', message: 'x', details: {} })

describe('shouldRetry', () => {
  it('4xx는 재시도하지 않는다', () => {
    expect(shouldRetry(0, apiError(404))).toBe(false)
    expect(shouldRetry(0, apiError(409))).toBe(false)
  })

  it('5xx와 네트워크 오류는 2번까지 재시도한다', () => {
    expect(shouldRetry(0, apiError(500))).toBe(true)
    expect(shouldRetry(1, apiError(0))).toBe(true)
    expect(shouldRetry(2, apiError(503))).toBe(false)
  })
})
