import { useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { CoursesService } from "@/client"
import {
  CreateCourseForm,
  Sidebar,
  TeacherCourseCard,
} from "@/components/Common"
import usePageTitle from "@/hooks/usePageTitle"
import styles from "./index.module.css"

type SearchParams = {
  tab?: string
}

export const Route = createFileRoute("/_layout/teach" as any)({
  component: TeachPage,
  validateSearch: (search: Record<string, unknown>): SearchParams => {
    return {
      tab: search.tab as string | undefined,
    }
  },
})

function TeachPage() {
  const { t } = useTranslation()
  usePageTitle("pages.teach")
  const navigate = useNavigate()
  const { tab: urlTab } = Route.useSearch()
  const [isCreatingCourse, setIsCreatingCourse] = useState(false)

  const tabs = useMemo(
    () => [
      { key: "courses", label: t("tabs.courses") },
      { key: "lessons", label: t("tabs.lessons") },
      { key: "classes", label: t("tabs.classes") },
      { key: "my-classes", label: t("tabs.myClasses") },
      { key: "my-students", label: t("tabs.myStudents") },
      { key: "notifications", label: t("tabs.notifications") },
      { key: "newsletters", label: t("tabs.newsletters") },
    ],
    [t],
  )

  const tab = urlTab || "courses"

  const setTab = (newTab: string) => {
    navigate({
      to: "/teach",
      search: { tab: newTab },
    } as any)
  }

  const handleNewCourse = () => {
    setIsCreatingCourse(true)
  }

  const handleEditCourse = (courseId: string) => {
    navigate({ to: `/course/${courseId}` })
  }

  const handleDuplicateCourse = (courseId: string) => {
    // TODO: Implement course duplication
    console.log("Duplicate course:", courseId)
  }

  const handleDeleteCourse = (courseId: string) => {
    // TODO: Implement course deletion
    console.log("Delete course:", courseId)
  }

  const { data: coursesData } = useQuery({
    queryKey: ["authorCourses"],
    queryFn: () => CoursesService.readAuthorCourses({ limit: 100 }),
    enabled: tab === "courses",
  })

  const authorCourses = useMemo(() => coursesData?.data ?? [], [coursesData])

  const currentLabel = tabs.find((t) => t.key === tab)?.label ?? tabs[0].label
  const renderContent = () => {
    switch (tab) {
      case "courses":
        if (isCreatingCourse) {
          return (
            <CreateCourseForm
              onSuccess={() => setIsCreatingCourse(false)}
              onCancel={() => setIsCreatingCourse(false)}
            />
          )
        }
        return (
          <div className={styles.grid}>
            {authorCourses.length === 0 ? (
              <p>{t("content.noCoursesYet")}</p>
            ) : (
              authorCourses.map((course) => (
                <TeacherCourseCard
                  key={course.id}
                  course={course as any}
                  onEdit={handleEditCourse}
                  onDuplicate={handleDuplicateCourse}
                  onDelete={handleDeleteCourse}
                />
              ))
            )}
          </div>
        )
      case "lessons":
        return <p>{t("content.lessonsManagement")}</p>
      case "classes":
      case "my-classes":
        return <p>{t("content.myClassesManagement")}</p>
      case "my-students":
        return <p>{t("content.myStudentsManagement")}</p>
      case "notifications":
        return <p>{t("content.notificationsManagement")}</p>
      case "newsletters":
        return <p>{t("content.newslettersManagement")}</p>
      default:
        return <p>{t("content.selectTab")}</p>
    }
  }

  return (
    <div>
      <div className={styles.container} role="main">
        <Sidebar
          tab={tab}
          setTab={setTab}
          mode="teach"
          onNewCourse={handleNewCourse}
        />

        <main className={styles.content}>
          <h1>
            {currentLabel} {t("content.titleSuffix")}
          </h1>
          {renderContent()}
        </main>
      </div>
    </div>
  )
}
