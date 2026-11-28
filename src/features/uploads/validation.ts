import { ALLOWED_EXTENSIONS, MAX_UPLOAD_BYTES } from '../../api/uploads'

/**
 * 올리기 전에 확장자와 크기를 확인한다. 서버도 다시 확인하지만,
 * 큰 파일을 끝까지 보낸 뒤에야 거절당하지 않게 하려는 것이다.
 * 문제가 없으면 null.
 */
export function validateLogFile(file: File): string | null {
  const dot = file.name.lastIndexOf('.')
  const extension = dot < 0 ? '' : file.name.slice(dot + 1).toLowerCase()
  if (!(ALLOWED_EXTENSIONS as readonly string[]).includes(extension)) {
    return '확장자가 .jsonl, .log, .txt인 파일만 올릴 수 있습니다.'
  }
  if (file.size === 0) {
    return '빈 파일입니다.'
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return '파일은 100MB를 넘을 수 없습니다.'
  }
  return null
}
