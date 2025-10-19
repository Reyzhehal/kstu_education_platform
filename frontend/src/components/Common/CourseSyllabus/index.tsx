import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { ModulesService } from "@/client"
import styles from "./CourseSyllabus.module.css"

type CourseSyllabusProps = {
  courseId: string
  isAuthor: boolean
  onEditClick: () => void
}

export default function CourseSyllabus({
  courseId,
  isAuthor,
  onEditClick,
}: CourseSyllabusProps) {
  const { t } = useTranslation()

  // Загружаем модули из API
  const { data: modules = [], isLoading } = useQuery({
    queryKey: ["courseModules", courseId],
    queryFn: () => ModulesService.readCourseModules({ courseId }),
  })

  if (isLoading) {
    return <div>{t("common.loading")}</div>
  }

  return (
    <div className={styles.root}>
      {isAuthor && (
        <div className={styles.header}>
          <button className={styles.editButton} onClick={onEditClick}>
            ✏️ {t("course.syllabus.editContent")}
          </button>
        </div>
      )}

      {modules.length === 0 ? (
        <div className={styles.empty}>
          <p>{t("course.syllabus.noModules")}</p>
          {isAuthor && (
            <button className={styles.addModuleButton} onClick={onEditClick}>
              + {t("course.syllabus.addFirstModule")}
            </button>
          )}
        </div>
      ) : (
        <div className={styles.modulesList}>
          {modules.map((module: any, index: number) => (
            <div key={module.id} className={styles.module}>
              <div className={styles.moduleHeader}>
                <h3 className={styles.moduleTitle}>
                  {index + 1}. {module.title}
                </h3>
                {module.description && (
                  <p className={styles.moduleDescription}>
                    {module.description}
                  </p>
                )}
              </div>

              {module.lessons && module.lessons.length > 0 && (
                <ul className={styles.lessonsList}>
                  {module.lessons.map((lesson: any, lessonIndex: number) => (
                    <li key={lesson.id} className={styles.lesson}>
                      <span className={styles.lessonNumber}>
                        {index + 1}.{lessonIndex + 1}
                      </span>
                      <span className={styles.lessonTitle}>{lesson.title}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
