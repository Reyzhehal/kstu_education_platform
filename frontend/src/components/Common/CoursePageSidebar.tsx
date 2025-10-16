import { useTranslation } from "react-i18next"
import EnrollButton from "@/components/Common/EnrollButton"
import CourseAuthorCard from "@/components/Common/CourseAuthorCard"

type Props = {
  onEnroll: () => void
  onUnenroll: () => void
  isEnrolled?: boolean
  isLoading?: boolean
  authorId?: string
}

export default function CoursePageSidebar({ onEnroll, onUnenroll, isEnrolled, isLoading, authorId }: Props) {
  useTranslation()
  return (
    <aside className="course-sidebar">
      {authorId ? <CourseAuthorCard authorId={authorId} /> : null}
      <EnrollButton isEnrolled={isEnrolled} isLoading={isLoading} onEnroll={onEnroll} onUnenroll={onUnenroll} />
    </aside>
  )
}


