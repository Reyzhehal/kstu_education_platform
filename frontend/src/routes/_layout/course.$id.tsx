import { useMemo } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { CoursesService } from "@/client"
import { withApiBase } from "@/utils"
import { useTranslation } from "react-i18next"
import CourseLearnList from "@/components/Common/CourseLearnList"
import CourseDescriptionBlocks from "@/components/Common/CourseDescriptionBlocks"
import CoursePageSidebar from "@/components/Common/CoursePageSidebar"
import usePageTitle from "@/hooks/usePageTitle"

export const Route = createFileRoute("/_layout/course/$id")({
  component: CoursePage,
})

function CoursePage() {
  const { id } = Route.useParams()
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const { data: course } = useQuery({
    queryKey: ["course", id],
    queryFn: () => CoursesService.readCourseById({ courseId: id }),
  })
  usePageTitle("coursePage.title", { title: course?.title ?? "" })

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

  const enrollMutation = useMutation({
    mutationFn: () => CoursesService.enrollCourse({ courseId: id }),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["course", id] })
      await queryClient.cancelQueries({ queryKey: ["progress"] })

      const prevCourse = queryClient.getQueryData<any>(["course", id])
      const prevProgress = queryClient.getQueryData<any>(["progress"])

      // Обновляем текущий курс
      if (prevCourse) {
        queryClient.setQueryData(["course", id], {
          ...prevCourse,
          is_enrolled: true,
          students_count: (prevCourse.students_count ?? 0) + 1,
        })
      }

      // Добавляем в список прогресса
      if (prevProgress?.data) {
        const exists = prevProgress.data.some((c: any) => c.id === id)
        const newData = exists ? prevProgress.data : [{ ...(prevCourse || {}), is_enrolled: true }, ...prevProgress.data]
        queryClient.setQueryData(["progress"], { ...prevProgress, data: newData, count: exists ? prevProgress.count : (prevProgress.count ?? newData.length) })
      }

      return { prevCourse, prevProgress }
    },
    onError: (_err, _vars, ctx) => {
      if (!ctx) return
      if (ctx.prevCourse) queryClient.setQueryData(["course", id], ctx.prevCourse)
      if (ctx.prevProgress) queryClient.setQueryData(["progress"], ctx.prevProgress)
    },
  })

  const unenrollMutation = useMutation({
    mutationFn: () => CoursesService.unenrollCourse({ courseId: id }),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["course", id] })
      await queryClient.cancelQueries({ queryKey: ["progress"] })

      const prevCourse = queryClient.getQueryData<any>(["course", id])
      const prevProgress = queryClient.getQueryData<any>(["progress"])

      if (prevCourse) {
        queryClient.setQueryData(["course", id], {
          ...prevCourse,
          is_enrolled: false,
          students_count: Math.max(0, (prevCourse.students_count ?? 0) - 1),
        })
      }

      if (prevProgress?.data) {
        const newData = prevProgress.data.filter((c: any) => c.id !== id)
        queryClient.setQueryData(["progress"], { ...prevProgress, data: newData, count: Math.max(0, (prevProgress.count ?? newData.length)) })
      }

      return { prevCourse, prevProgress }
    },
    onError: (_err, _vars, ctx) => {
      if (!ctx) return
      if (ctx.prevCourse) queryClient.setQueryData(["course", id], ctx.prevCourse)
      if (ctx.prevProgress) queryClient.setQueryData(["progress"], ctx.prevProgress)
    },
  })

  if (!course) {
    return <div className="content"><p>{t("coursePage.notFound")}</p></div>
  }

  const cover = course.cover_image ? withApiBase(course.cover_image) : "/assets/images/header-img-night.png"

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
          <div>
            <CourseLearnList items={learnData ?? []} />
            <CourseDescriptionBlocks blocks={normalizedBlocks} />
          </div>
          <CoursePageSidebar
            onEnroll={() => enrollMutation.mutate()}
            onUnenroll={() => unenrollMutation.mutate()}
            isEnrolled={course.is_enrolled}
            isLoading={enrollMutation.isPending || unenrollMutation.isPending}
            authorId={course.author_id}
          />
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

 
