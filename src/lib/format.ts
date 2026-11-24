const dateTimeFormat = new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short' })

/** ISO-8601 시각을 사용자 로컬 시간대의 "2026. 11. 23. 오후 7:00" 형식으로 */
export function formatDateTime(iso: string): string {
  return dateTimeFormat.format(new Date(iso))
}
