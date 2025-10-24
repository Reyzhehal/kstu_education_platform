import { useQuery } from "@tanstack/react-query"
import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { CoursesService, LessonsService, ModulesService } from "@/client"
import styles from "./LessonNavigationSidebar.module.css"

type LessonNavigationSidebarProps = {
  courseId: string | null
  currentLessonId: string
  onLessonSelect: (lessonId: string) => void
  onCourseIdFound: (courseId: string) => void
}

export default function LessonNavigationSidebar({
  courseId,
  currentLessonId,
  onLessonSelect,
  onCourseIdFound,
}: LessonNavigationSidebarProps) {
  const { t } = useTranslation()

  const { data: currentLesson } = useQuery({
    queryKey: ["lesson", currentLessonId],
    queryFn: () => LessonsService.readLesson({ lessonId: currentLessonId }),
  })

  const { data: currentModule } = useQuery({
    queryKey: ["module", currentLesson?.module_id],
    queryFn: () =>
      currentLesson?.module_id
        ? ModulesService.readModule({ moduleId: currentLesson.module_id })
        : null,
    enabled: !!currentLesson?.module_id,
  })

  useEffect(() => {
    if (currentModule?.course_id && !courseId) {
      onCourseIdFound(currentModule.course_id)
    }
  }, [currentModule?.course_id, courseId, onCourseIdFound])

  const { data: course } = useQuery({
    queryKey: ["course", courseId],
    queryFn: () =>
      courseId ? CoursesService.readCourse({ id: courseId }) : null,
    enabled: !!courseId,
  })

  const { data: modules } = useQuery({
    queryKey: ["courseModules", courseId],
    queryFn: () =>
      courseId ? ModulesService.readCourseModules({ courseId }) : null,
    enabled: !!courseId,
  })

  const isLoading = !courseId || !modules

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <h2 className={styles.sidebarTitle}>
          {course?.title || t("lesson.edit.courseContent")}
        </h2>
      </div>
      <div className={styles.modulesList}>
        {isLoading ? (
          <div className={styles.loading}>{t("common.loading")}</div>
        ) : modules?.length === 0 ? (
          <div className={styles.empty}>{t("lesson.edit.noContent")}</div>
        ) : (
          modules?.map((module: any, moduleIndex: number) => (
            <div key={module.id} className={styles.module}>
              <div className={styles.moduleTitle}>
                {moduleIndex + 1}. {module.title}
              </div>
              <ul className={styles.lessonsList}>
                {module.lessons?.map((lesson: any, lessonIndex: number) => (
                  <li
                    key={lesson.id}
                    className={`${styles.lessonItem} ${
                      lesson.id === currentLessonId ? styles.active : ""
                    }`}
                    onClick={() => onLessonSelect(lesson.id)}
                  >
                    <span className={styles.lessonNumber}>
                      {moduleIndex + 1}.{lessonIndex + 1}
                    </span>
                    <span className={styles.lessonTitle}>{lesson.title}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>
    </aside>
  )
}
