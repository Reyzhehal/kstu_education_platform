import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { CoursesService } from "@/client"
import {
  CourseDescriptionBlocks,
  CourseLearnList,
  CoursePageSidebar,
} from "@/components/Common"
import usePageTitle from "@/hooks/usePageTitle"
import { withApiBase } from "@/utils"
import styles from "./index.module.css"

export const Route = createFileRoute("/_layout/promo/$id")({
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
      .map((b: any) => ({
        title: String(b?.title ?? ""),
        text: String(b?.text ?? ""),
      }))
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
        const newData = exists
          ? prevProgress.data
          : [{ ...(prevCourse || {}), is_enrolled: true }, ...prevProgress.data]
        queryClient.setQueryData(["progress"], {
          ...prevProgress,
          data: newData,
          count: exists
            ? prevProgress.count
            : (prevProgress.count ?? newData.length),
        })
      }

      return { prevCourse, prevProgress }
    },
    onError: (_err, _vars, ctx) => {
      if (!ctx) return
      if (ctx.prevCourse)
        queryClient.setQueryData(["course", id], ctx.prevCourse)
      if (ctx.prevProgress)
        queryClient.setQueryData(["progress"], ctx.prevProgress)
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
        queryClient.setQueryData(["progress"], {
          ...prevProgress,
          data: newData,
          count: Math.max(0, prevProgress.count ?? newData.length),
        })
      }

      return { prevCourse, prevProgress }
    },
    onError: (_err, _vars, ctx) => {
      if (!ctx) return
      if (ctx.prevCourse)
        queryClient.setQueryData(["course", id], ctx.prevCourse)
      if (ctx.prevProgress)
        queryClient.setQueryData(["progress"], ctx.prevProgress)
    },
  })

  if (!course) {
    return (
      <div className={styles.body}>
        <div className={styles.bodyInner}>
          <p>{t("coursePage.notFound")}</p>
        </div>
      </div>
    )
  }

  const cover = course.cover_image
    ? withApiBase(course.cover_image)
    : "/assets/images/header-img-night.png"

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div>
            <h1 className={styles.heroTitle}>{course.title}</h1>
            <p className={styles.heroDesc}>{course.description ?? ""}</p>
            <div className={styles.heroMeta}>
              <span className={styles.badge}>
                {t("coursePage.level")}:{" "}
                {levelLabel(course.difficulty_level, t)}
              </span>
              {course.hours_week ? (
                <span className={styles.badge}>
                  {course.hours_week} {t("coursePage.hoursPerWeek")}
                </span>
              ) : null}
              {course.has_certificate ? (
                <span className={styles.badge}>
                  {t("coursePage.certificate")}
                </span>
              ) : (
                <span className={`${styles.badge} ${styles.badgeMuted}`}>
                  {t("coursePage.noCertificate")}
                </span>
              )}
            </div>
          </div>
          <div>
            <img className={styles.heroImage} src={cover} alt="" />
          </div>
        </div>
      </section>

      <section className={styles.body}>
        <div className={styles.bodyInner}>
          <div>
            {/* Краткое описание */}
            {course.short_description && (
              <div className={styles.section}>
                <div className={styles.sectionContent}>
                  {course.short_description}
                </div>
              </div>
            )}

            {/* Что вы получите */}
            {course.what_you_get && (
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>
                  {t("coursePage.whatYouGet")}
                </h2>
                <div className={`${styles.sectionContent} markdown-body`}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {course.what_you_get}
                  </ReactMarkdown>
                </div>
              </div>
            )}

            {/* Что вы изучите - из отдельного API (списком) */}
            <CourseLearnList items={learnData ?? []} />

            {/* Что вы изучите - из поля модели */}
            {course.what_you_will_learn && (
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>
                  {t("coursePage.whatYouWillLearn")}
                </h2>
                <div className={`${styles.sectionContent} markdown-body`}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {course.what_you_will_learn}
                  </ReactMarkdown>
                </div>
              </div>
            )}

            {/* Требования */}
            {course.requirements && (
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>
                  {t("coursePage.requirements")}
                </h2>
                <div className={`${styles.sectionContent} markdown-body`}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {course.requirements}
                  </ReactMarkdown>
                </div>
              </div>
            )}

            {/* Целевая аудитория */}
            {course.target_audience && (
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>
                  {t("coursePage.targetAudience")}
                </h2>
                <div className={`${styles.sectionContent} markdown-body`}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {course.target_audience}
                  </ReactMarkdown>
                </div>
              </div>
            )}

            {/* Как проходит обучение */}
            {course.how_it_works && (
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>
                  {t("coursePage.howItWorks")}
                </h2>
                <div className={`${styles.sectionContent} markdown-body`}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {course.how_it_works}
                  </ReactMarkdown>
                </div>
              </div>
            )}

            {/* Блоки описания из отдельного API */}
            <CourseDescriptionBlocks blocks={normalizedBlocks} />
          </div>
          <div className={styles.sidebarAbs}>
            <CoursePageSidebar
              onEnroll={() => enrollMutation.mutate()}
              onUnenroll={() => unenrollMutation.mutate()}
              isEnrolled={course.is_enrolled}
              isLoading={enrollMutation.isPending || unenrollMutation.isPending}
              authorId={course.author_id}
            />
          </div>
        </div>
      </section>
    </div>
  )
}

function levelLabel(level: number | undefined, t: any) {
  switch (level) {
    case 1:
      return t("catalog.difficulty.beginner")
    case 2:
      return t("catalog.difficulty.intermediate")
    case 3:
      return t("catalog.difficulty.advanced")
    default:
      return t("catalog.difficulty.beginner")
  }
}

// резервный метод больше не нужен, список берём с бэка

// блоки теперь приходят с бэка
