import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
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
  const navigate = useNavigate()

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
                      <div className={styles.lessonIcon}>
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <circle
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="2"
                          />
                          <path
                            d="M12 8v8M8 12h8"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                      </div>
                      <span className={styles.lessonNumber}>
                        {index + 1}.{lessonIndex + 1}
                      </span>
                      <span className={styles.lessonTitle}>{lesson.title}</span>
                      {isAuthor && (
                        <button
                          className={styles.lessonEditButton}
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate({ to: `/lesson/${lesson.id}/edit` } as any)
                          }}
                          title={t("common.edit")}
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <path
                              d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      )}
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
