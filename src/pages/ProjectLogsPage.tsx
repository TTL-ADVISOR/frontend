import { useParams } from 'react-router'
import UploadSection from '../features/uploads/UploadSection'

/** 로그: 올리기, 처리 상태, 이력 */
export default function ProjectLogsPage() {
  const projectId = Number(useParams().projectId)
  return <UploadSection projectId={projectId} />
}
