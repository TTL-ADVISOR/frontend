import { PROJECT_NAME_MAX } from '../../api/projects'

/** 서버(@NotBlank, @Size(max=100))와 같은 규칙. 통과하면 null. */
export function validateProjectName(name: string): string | null {
  const trimmed = name.trim()
  if (trimmed.length === 0) return '이름을 입력해 주세요.'
  if (trimmed.length > PROJECT_NAME_MAX) return `이름은 ${PROJECT_NAME_MAX}자 이하여야 합니다.`
  return null
}
