import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { CoursesService } from "@/client"
import {
  CourseDescriptionEditor,
  CourseSyllabus,
  CourseSyllabusEditor,
} from "@/components/Common"
import useAuth from "@/hooks/useAuth"
import useCustomToast from "@/hooks/useCustomToast"
import usePageTitle from "@/hooks/usePageTitle"
import styles from "./index.module.css"

export const Route = createFileRoute("/_layout/course/$courseId/$tab")({
  component: CoursePage,
})

function CoursePage() {
  const { courseId, tab } = Route.useParams()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [isEditingSyllabus, setIsEditingSyllabus] = useState(false)

  const { data: course, isLoading } = useQuery({
    queryKey: ["course", courseId],
    queryFn: () => CoursesService.readCourseById({ courseId }),
  })

  usePageTitle(course?.title ?? "Курс")

  const isAuthor = course?.author_id === user?.id

  const setTab = (newTab: string) => {
    navigate({
      to: `/course/${courseId}/${newTab}`,
    } as any)
  }

  if (isLoading) {
    return <div className={styles.container}>{t("common.loading")}</div>
  }

  if (!course) {
    return <div className={styles.container}>{t("coursePage.notFound")}</div>
  }

  // If not published and not author, show not found
  if (!course.is_published && !isAuthor) {
    return <div className={styles.container}>{t("coursePage.notFound")}</div>
  }

  const renderContent = () => {
    switch (tab) {
      case "description":
        if (isAuthor && isEditingDescription) {
          return (
            <CourseDescriptionEditor
              course={course as any}
              onCancel={() => setIsEditingDescription(false)}
            />
          )
        }

        return (
          <div>
            <div className={styles.contentHeader}>
              <h1>{t("course.aboutCourseTitle")}</h1>
              {isAuthor && (
                <button
                  onClick={() => setIsEditingDescription(true)}
                  className={styles.editButton}
                >
                  {t("common.edit")}
                </button>
              )}
            </div>
            {course.description ? (
              <div
                className={styles.richTextContent}
                dangerouslySetInnerHTML={{ __html: course.description }}
              />
            ) : (
              <div className={styles.emptyState}>
                <p>
                  {isAuthor
                    ? t("course.addDescriptionHint")
                    : t("course.noDescription")}
                </p>
              </div>
            )}
          </div>
        )
      case "syllabus":
        if (isAuthor && isEditingSyllabus) {
          return (
            <CourseSyllabusEditor
              courseId={courseId}
              onCancel={() => setIsEditingSyllabus(false)}
            />
          )
        }

        return (
          <div>
            <div className={styles.contentHeader}>
              <h1>{t("course.syllabusTitle")}</h1>
            </div>
            <CourseSyllabus
              courseId={courseId}
              isAuthor={isAuthor}
              onEditClick={() => setIsEditingSyllabus(true)}
            />
          </div>
        )
      case "checklist":
        return (
          <div>
            <div className={styles.contentHeader}>
              <h1>{t("course.checklistTitle")}</h1>
            </div>
            <p>{t("course.checklistContent")}</p>
          </div>
        )
      default:
        return <p>{t("content.selectTab")}</p>
    }
  }

  return (
    <div>
      <div className={styles.container} role="main">
        <CourseSidebar
          tab={tab}
          setTab={setTab}
          isAuthor={isAuthor}
          course={course as any}
        />

        <main className={styles.content}>{renderContent()}</main>
      </div>
    </div>
  )
}

type CourseSidebarProps = {
  tab: string
  setTab: (tab: string) => void
  isAuthor: boolean
  course: any
}

function CourseSidebar({ tab, setTab, isAuthor, course }: CourseSidebarProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const [isCourseOpen, setIsCourseOpen] = useState(true)

  const publishMutation = useMutation({
    mutationFn: () => CoursesService.publishCourse({ courseId: course.id }),
    onSuccess: () => {
      showSuccessToast(t("course.publishSuccess"))
      queryClient.invalidateQueries({ queryKey: ["course", course.id] })
      queryClient.invalidateQueries({ queryKey: ["authorCourses"] })
    },
    onError: (err: any) => {
      const errDetail = err.body?.detail || t("common.error")
      showErrorToast(errDetail)
    },
  })

  const handlePublish = () => {
    if (confirm(t("course.publishConfirm"))) {
      publishMutation.mutate()
    }
  }

  const tabs = [
    {
      key: "course",
      label: t("tabs.course"),
      icon: "📖",
      hasSubmenu: true,
      submenu: [
        { key: "description", label: t("tabs.description") },
        { key: "syllabus", label: t("tabs.syllabus") },
        { key: "checklist", label: t("tabs.checklist") },
      ],
    },
  ]

  return (
    <aside className={styles.courseSidebar}>
      <div className={styles.sidebarHeader}>
        <img
          src={course.cover_image || "/assets/images/header-img-night.png"}
          alt={course.title}
          className={styles.courseCover}
        />
        <h3 className={styles.courseTitle}>{course.title}</h3>
        {isAuthor && !course.is_published && (
          <button
            className={styles.publishBtn}
            onClick={handlePublish}
            disabled={publishMutation.isPending}
          >
            {publishMutation.isPending
              ? t("common.loading")
              : t("course.publish")}
          </button>
        )}
      </div>

      <ul className={styles.menu}>
        {tabs.map((item) => (
          <div key={item.key}>
            <li
              className={`${styles.menuItem} ${item.key === tab ? styles.active : ""}`}
              onClick={() => {
                if (item.hasSubmenu) {
                  setIsCourseOpen(!isCourseOpen)
                } else {
                  setTab(item.key)
                }
              }}
            >
              <span className={styles.menuIcon}>{item.icon}</span>
              <span className={styles.menuLabel}>{item.label}</span>
              {item.hasSubmenu && (
                <span className={styles.arrow}>{isCourseOpen ? "▼" : "▶"}</span>
              )}
            </li>
            {item.hasSubmenu && isCourseOpen && item.submenu && (
              <ul className={styles.submenu}>
                {item.submenu.map((subitem) => (
                  <li
                    key={subitem.key}
                    className={`${styles.submenuItem} ${subitem.key === tab ? styles.active : ""}`}
                    onClick={() => setTab(subitem.key)}
                  >
                    {subitem.label}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </ul>
    </aside>
  )
}
