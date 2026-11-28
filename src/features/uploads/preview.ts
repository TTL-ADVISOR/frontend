/**
 * 올리기 전 미리보기: 파일 앞부분의 처음 몇 줄을 읽어 서버 파서와 같은 규칙으로 필드를 확인한다.
 * 정확한 판정은 서버가 한다. 여기서는 형식이 크게 틀린 파일과 빠진 선택 필드를 미리 알려 주는 데만 쓴다.
 */

export const PREVIEW_LINES = 5
/** 앞부분만 읽는다. 큰 파일을 통째로 메모리에 올리지 않는다 */
const PREVIEW_BYTES = 64 * 1024
const MAX_SHOWN_CHARS = 240

export const REQUIRED_FIELDS = ['ts', 'method', 'path', 'status'] as const
export const OPTIONAL_FIELDS = ['latencyMs', 'size', 'respHash'] as const
type Field = (typeof REQUIRED_FIELDS)[number] | (typeof OPTIONAL_FIELDS)[number]

export interface PreviewLine {
  number: number
  text: string
  /** 형식에 맞지 않으면 사유 */
  error: string | null
}

export interface LogPreview {
  lines: PreviewLine[]
  /** 필수 필드별로 처음 문제가 생긴 줄과 사유. 문제가 없으면 null */
  required: Record<(typeof REQUIRED_FIELDS)[number], { line: number; reason: string } | null>
  /** 선택 필드가 미리 본 줄 중 하나라도 있으면 true */
  optional: Record<(typeof OPTIONAL_FIELDS)[number], boolean>
}

const HTTP_METHOD = /^[A-Za-z0-9!#$%&'*+.^_`|~-]{1,10}$/
const ISO_WITH_ZONE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/

export async function readPreview(file: File): Promise<LogPreview> {
  const head = await file.slice(0, PREVIEW_BYTES).text()
  let rows = head.replace(/^﻿/, '').split(/\r?\n/)
  // 앞부분만 읽었으면 마지막 줄은 잘렸을 수 있다
  if (file.size > PREVIEW_BYTES) rows = rows.slice(0, -1)
  // 파일 끝의 줄바꿈 뒤 빈 문자열은 줄이 아니다
  if (rows.at(-1) === '') rows = rows.slice(0, -1)
  rows = rows.slice(0, PREVIEW_LINES)

  const required: LogPreview['required'] = { ts: null, method: null, path: null, status: null }
  const optional: LogPreview['optional'] = { latencyMs: false, size: false, respHash: false }

  const lines = rows.map((text, i): PreviewLine => {
    const number = i + 1
    const shown = text.length > MAX_SHOWN_CHARS ? `${text.slice(0, MAX_SHOWN_CHARS)}…` : text
    let node: unknown
    try {
      node = JSON.parse(text)
    } catch {
      for (const field of REQUIRED_FIELDS) required[field] ??= { line: number, reason: 'JSON이 아님' }
      return { number, text: shown, error: 'JSON 파싱 실패' }
    }
    if (typeof node !== 'object' || node === null || Array.isArray(node)) {
      for (const field of REQUIRED_FIELDS) required[field] ??= { line: number, reason: 'JSON 객체가 아님' }
      return { number, text: shown, error: 'JSON 객체가 필요합니다' }
    }
    const record = node as Record<string, unknown>
    let error: string | null = null
    for (const field of REQUIRED_FIELDS) {
      const reason = checkField(field, record[field])
      if (reason) {
        required[field] ??= { line: number, reason }
        error ??= `${field}: ${reason}`
      }
    }
    for (const field of OPTIONAL_FIELDS) {
      const value = record[field]
      if (value === undefined || value === null) continue
      const reason = checkField(field, value)
      if (reason) error ??= `${field}: ${reason}`
      else optional[field] = true
    }
    return { number, text: shown, error }
  })

  return { lines, required, optional }
}

function checkField(field: Field, value: unknown): string | null {
  if (value === undefined || value === null) return '필드 없음'
  switch (field) {
    case 'ts':
      if (typeof value !== 'string' || !ISO_WITH_ZONE.test(value) || Number.isNaN(Date.parse(value))) {
        return '시간대가 있는 ISO-8601 시각이 아님'
      }
      return null
    case 'method':
      return typeof value === 'string' && HTTP_METHOD.test(value) ? null : 'HTTP 메서드가 아님'
    case 'path':
      return typeof value === 'string' && value.startsWith('/') && !/[\s#]/.test(value) && value.length <= 500
        ? null
        : '/로 시작하고 공백·#이 없는 경로가 아님'
    case 'status':
      return Number.isInteger(value) && (value as number) >= 100 && (value as number) <= 599
        ? null
        : '100~599 정수가 아님'
    case 'latencyMs':
    case 'size':
      return Number.isInteger(value) && (value as number) >= 0 && (value as number) <= 2_147_483_647
        ? null
        : '0 이상 정수가 아님'
    case 'respHash':
      return typeof value === 'string' && value.trim() !== '' && [...value].length <= 64
        ? null
        : '64자 이하 문자열이 아님'
  }
}
