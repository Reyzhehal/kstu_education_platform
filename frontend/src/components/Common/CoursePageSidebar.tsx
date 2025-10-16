import { useTranslation } from "react-i18next"
import EnrollButton from "@/components/Common/EnrollButton"

type Props = {
  onEnroll: () => void
  onUnenroll: () => void
  isEnrolled?: boolean
  isLoading?: boolean
}

export default function CoursePageSidebar({ onEnroll, onUnenroll, isEnrolled, isLoading }: Props) {
  useTranslation()
  return (
    <aside className="course-sidebar">
      <EnrollButton isEnrolled={isEnrolled} isLoading={isLoading} onEnroll={onEnroll} onUnenroll={onUnenroll} />
    </aside>
  )
}


