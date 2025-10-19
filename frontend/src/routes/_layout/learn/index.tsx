import { useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { CoursesService } from "@/client"
import { CourseCard, Sidebar } from "@/components/Common"
import usePageTitle from "@/hooks/usePageTitle"
import styles from "./index.module.css"

type SearchParams = {
  tab?: string
}

export const Route = createFileRoute("/_layout/learn" as any)({
  component: LearnPage,
  validateSearch: (search: Record<string, unknown>): SearchParams => {
    return {
      tab: search.tab as string | undefined,
    }
  },
})

function LearnPage() {
  const { t } = useTranslation()
  usePageTitle("pages.main")
  const navigate = useNavigate()
  const { tab: urlTab } = Route.useSearch()

  const tabs = useMemo(
    () => [
      { key: "learn", label: t("tabs.learn") },
      { key: "courses", label: t("tabs.courses") },
      { key: "progress", label: t("tabs.progress") },
      { key: "favorites", label: t("tabs.favorites") },
      { key: "archive", label: t("tabs.archive") },
      { key: "classes", label: t("tabs.classes") },
      { key: "notifications", label: t("tabs.notifications") },
    ],
    [t],
  )

  const tab = urlTab || "learn"

  const setTab = (newTab: string) => {
    navigate({
      to: "/learn",
      search: { tab: newTab },
    } as any)
  }

  const currentLabel = tabs.find((t) => t.key === tab)?.label ?? tabs[0].label
  const renderContent = () => {
    switch (tab) {
      case "courses":
        return <p>{t("content.coursesListSoon")}</p>
      case "progress":
        return <ProgressCourses />
      case "favorites":
        return <FavoriteCourses />
      case "archive":
        return <p>{t("content.archive")}</p>
      case "classes":
        return <p>{t("content.classes")}</p>
      case "notifications":
        return <p>{t("content.notifications")}</p>
      default:
        return <p>{t("content.welcome")}</p>
    }
  }
  return (
    <div>
      <div className={styles.container} role="main">
        <Sidebar tab={tab} setTab={setTab} mode="learn" />

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

function FavoriteCourses() {
  const { t } = useTranslation()
  const { data: favoritesData } = useQuery({
    queryKey: ["favorites"],
    queryFn: () => CoursesService.readFavoriteCourses({ limit: 100 }),
  })

  const favoriteCourses = useMemo(
    () => favoritesData?.data ?? [],
    [favoritesData],
  )
  return (
    <div className={styles.grid}>
      {favoriteCourses.length === 0 ? (
        <p>{t("content.noFavorites")}</p>
      ) : (
        favoriteCourses.map((course) => (
          <CourseCard key={course.id} course={course} variant="default" />
        ))
      )}
    </div>
  )
}

function ProgressCourses() {
  const { t } = useTranslation()
  const { data } = useQuery({
    queryKey: ["progress"],
    queryFn: () => CoursesService.readMyCourses({ limit: 100 }),
  })
  const courses = data?.data ?? []
  return (
    <div className={styles.grid}>
      {courses.length === 0 ? (
        <p>{t("content.yourProgress")}</p>
      ) : (
        courses.map((course) => (
          <CourseCard key={course.id} course={course} variant="default" />
        ))
      )}
    </div>
  )
}
