import { useMemo } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { CoursesService } from "@/client"
import { useTranslation } from "react-i18next"
import CourseLearnList from "@/components/Common/CourseLearnList"
import CourseDescriptionBlocks from "@/components/Common/CourseDescriptionBlocks"

export const Route = createFileRoute("/_layout/course/$id")({
  component: CoursePage,
})

function CoursePage() {
  const { id } = Route.useParams()
  const { t } = useTranslation()

  const { data: course } = useQuery({
    queryKey: ["course", id],
    queryFn: () => CoursesService.readCourseById({ courseId: id }),
  })

  const { data: learnData } = useQuery({
    queryKey: ["course", id, "learn"],
    queryFn: () => CoursesService.readCourseLearnLines({ courseId: id }),
  })

  const { data: blocksData } = useQuery({
    queryKey: ["course", id, "blocks"],
    queryFn: () => CoursesService.readCourseDescriptionBlocks({ courseId: id }),
  })

  const normalizedBlocks = useMemo(() => {
    const arr = Array.isArray(blocksData) ? blocksData : []
    return arr
      .map((b: any) => ({ title: String(b?.title ?? ""), text: String(b?.text ?? "") }))
      .filter((b) => b.title || b.text)
  }, [blocksData])

  if (!course) {
    return <div className="content"><p>{t("coursePage.notFound")}</p></div>
  }

  const apiUrl = import.meta.env.VITE_API_URL || ""
  const cover = course.cover_image ? `${apiUrl}/${course.cover_image}` : "/assets/images/header-img-night.png"

  return (
    <div className="course-page">
      <section className="course-hero">
        <div className="course-hero__inner">
          <div className="course-hero__text">
            <h1 className="course-hero__title">{course.title}</h1>
            <p className="course-hero__desc">{course.description ?? ""}</p>
            <div className="course-hero__meta">
              <span className="course-hero__badge">{t("coursePage.level")}: {levelLabel(course.difficulty_level, t)}</span>
              {course.hours_week ? (
                <span className="course-hero__badge">{course.hours_week} {t("coursePage.hoursPerWeek")}</span>
              ) : null}
              {course.has_certificate ? (
                <span className="course-hero__badge">{t("coursePage.certificate")}</span>
              ) : (
                <span className="course-hero__badge is-muted">{t("coursePage.noCertificate")}</span>
              )}
            </div>
          </div>
          <div className="course-hero__image-wrap">
            <img className="course-hero__image" src={cover} alt="" />
          </div>
        </div>
      </section>

      <section className="course-body">
        <div className="course-body__inner">
          <CourseLearnList items={learnData ?? []} />

          <CourseDescriptionBlocks blocks={normalizedBlocks} />
        </div>
      </section>
    </div>
  )
}

function levelLabel(level: number | undefined, t: any) {
  switch (level) {
    case 1: return t("catalog.difficulty.beginner")
    case 2: return t("catalog.difficulty.intermediate")
    case 3: return t("catalog.difficulty.advanced")
    default: return t("catalog.difficulty.beginner")
  }
}

// резервный метод больше не нужен, список берём с бэка

// блоки теперь приходят с бэка

 
