import { useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import type { CoursePublic } from "@/client"
import { withApiBase } from "@/utils"
import styles from "./TeacherCourseCard.module.css"

type TeacherCourseCardProps = {
  course: CoursePublic
  onEdit?: (courseId: string) => void
  onDuplicate?: (courseId: string) => void
  onDelete?: (courseId: string) => void
}

export default function TeacherCourseCard({
  course,
  onEdit,
  onDuplicate,
  onDelete,
}: TeacherCourseCardProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const coverImage = course.cover_image
    ? withApiBase(course.cover_image)
    : "/assets/images/header-img-night.png"

  const handleCardClick = () => {
    navigate({ to: `/course/${course.id}` })
  }

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    setMenuOpen(!menuOpen)
  }

  const handleMenuAction = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation()
    setMenuOpen(false)
    action()
  }

  return (
    <div className={styles.root} onClick={handleCardClick}>
      <img className={styles.img} src={coverImage} alt="" />

      <div className={styles.body}>
        <div className={styles.header}>
          <span className={styles.status}>
            ⚪ {t("teacherCourse.draft", { defaultValue: "Черновик" })}
          </span>
          <button
            className={styles.menuButton}
            onClick={handleMenuToggle}
            aria-label="Меню действий"
          >
            ⋮
          </button>

          {menuOpen && (
            <div className={styles.menu}>
              <button
                className={styles.menuItem}
                onClick={(e) => handleMenuAction(e, () => onEdit?.(course.id))}
              >
                {t("teacherCourse.edit", { defaultValue: "Редактировать" })}
              </button>
              <button
                className={styles.menuItem}
                onClick={(e) =>
                  handleMenuAction(e, () => onDuplicate?.(course.id))
                }
              >
                {t("teacherCourse.duplicate", {
                  defaultValue: "Создать копию",
                })}
              </button>
              <button
                className={`${styles.menuItem} ${styles.menuItemDanger}`}
                onClick={(e) =>
                  handleMenuAction(e, () => onDelete?.(course.id))
                }
              >
                {t("teacherCourse.delete", { defaultValue: "Удалить" })}
              </button>
            </div>
          )}
        </div>

        <div className={styles.title}>{course.title}</div>

        <div className={styles.tabs}>
          <button
            className={styles.tab}
            onClick={(e) => {
              e.stopPropagation()
              navigate({ to: `/course/${course.id}` })
            }}
          >
            {t("teacherCourse.description", { defaultValue: "Описание" })}
          </button>
          <button
            className={styles.tab}
            onClick={(e) => {
              e.stopPropagation()
              navigate({ to: `/course/${course.id}` })
            }}
          >
            {t("teacherCourse.content", { defaultValue: "Содержание" })}
          </button>
          <button
            className={styles.tab}
            onClick={(e) => {
              e.stopPropagation()
              navigate({ to: `/course/${course.id}` })
            }}
          >
            {t("teacherCourse.access", { defaultValue: "Права доступа" })}
          </button>
        </div>
      </div>
    </div>
  )
}
