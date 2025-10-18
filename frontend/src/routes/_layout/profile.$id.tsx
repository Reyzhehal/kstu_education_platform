import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import React, { useMemo } from "react"
import { useTranslation } from "react-i18next"
import {
  type CoursePublic,
  CoursesService,
  type UserPublic,
  UsersService,
} from "@/client"
import { CourseCard, Pagination } from "@/components/Common"
import usePageTitle from "@/hooks/usePageTitle"
import { withApiBase } from "@/utils"
import { renderMarkdown } from "@/utils/markdown"
import { extractLastSegment, getHost } from "@/utils/social"
import { getFullName } from "@/utils/user"
import styles from "./profile.module.css"

export const Route = createFileRoute("/_layout/profile/$id")({
  component: ProfileByIdPage,
})

function ProfileByIdPage() {
  const { id } = Route.useParams()
  const { t } = useTranslation("common")

  const {
    data: user,
    isLoading,
    isError,
  } = useQuery<UserPublic>({
    queryKey: ["user", id],
    queryFn: () => UsersService.readUserById({ userId: id }),
  })
  usePageTitle("profilePage.title", {
    title: getFullName(user, { fallback: "" }),
  })

  const { data: coursesResp } = useQuery({
    queryKey: ["courses", "by-author", id],
    // пока нет фильтра по author_id — берём список и считаем на клиенте
    queryFn: () => CoursesService.readCourses({ limit: 200 }),
  })

  const authoredCoursesCount = useMemo(() => {
    const list: CoursePublic[] = coursesResp?.data ?? []
    return list.filter((c) => c.author_id === id).length
  }, [coursesResp, id])

  const authoredCourses = useMemo(() => {
    const list: CoursePublic[] = coursesResp?.data ?? []
    return list.filter((c) => c.author_id === id)
  }, [coursesResp, id])

  // const displayedCourses = useMemo(() => {
  //   if (!authoredCourses.length) return [] as CoursePublic[]
  //   const times = 10
  //   const arr: CoursePublic[] = []
  //   for (let i = 0; i < times; i++) arr.push(...authoredCourses)
  //   return arr
  // }, [authoredCourses])

  const pageSize = 6
  const [page, setPage] = React.useState(1)
  const totalPages = Math.max(1, Math.ceil(authoredCourses.length / pageSize))
  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize
    return authoredCourses.slice(start, start + pageSize)
  }, [authoredCourses, page])

  if (isLoading) {
    return (
      <div style={{ padding: 24 }}>
        <p>Загрузка профиля…</p>
      </div>
    )
  }
  if (isError || !user) {
    return (
      <div style={{ padding: 24 }}>
        <p>Пользователь не найден</p>
      </div>
    )
  }

  const avatarUrl = user.avatar_image ? withApiBase(user.avatar_image) : null
  const cover = user.cover_image
    ? withApiBase(user.cover_image)
    : "/assets/images/header-img-night.png"
  const name = getFullName(user)

  return (
    <div className={styles.page}>
      <section className={styles.cover}>
        <div className={styles.coverInner}>
          <img className={styles.coverImage} src={cover} alt="" />
        </div>
      </section>

      <section className={styles.body}>
        <div className={styles.layout}>
          <aside className={styles.sidebar}>
            {avatarUrl ? (
              <img className={styles.avatar} src={avatarUrl} alt="" />
            ) : (
              <div
                className={`${styles.avatar} ${styles.avatarPlaceholder}`}
                aria-hidden="true"
              >
                {name.trim().charAt(0).toUpperCase()}
              </div>
            )}
            {authoredCoursesCount > 0 ? (
              <div className={styles.stats}>
                <div className={styles.stat}>
                  <div className={styles.statLabel}>
                    {t("profilePage.coursesCount", { defaultValue: "Курсов" })}
                  </div>
                  <div className={styles.statValue}>{authoredCoursesCount}</div>
                </div>
              </div>
            ) : null}

            {/* Social links in sidebar */}
            <div className={styles.links}>
              {user.website_url ? (
                <a
                  className={styles.link}
                  href={user.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    className={styles.linkIcon}
                    src="/assets/icons/website.svg"
                    alt=""
                  />
                  <span className={styles.linkText}>
                    {getHost(user.website_url)}
                  </span>
                </a>
              ) : null}
              {user.telegram_url ? (
                <a
                  className={styles.link}
                  href={user.telegram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    className={styles.linkIcon}
                    src="/assets/icons/telegram.svg"
                    alt=""
                  />
                  <span className={styles.linkText}>
                    {extractLastSegment(user.telegram_url)}
                  </span>
                </a>
              ) : null}
              {user.github_url ? (
                <a
                  className={styles.link}
                  href={user.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    className={styles.linkIcon}
                    src="/assets/icons/github.svg"
                    alt=""
                  />
                  <span className={styles.linkText}>
                    {extractLastSegment(user.github_url)}
                  </span>
                </a>
              ) : null}
              {user.youtube_url ? (
                <a
                  className={styles.link}
                  href={user.youtube_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    className={styles.linkIcon}
                    src="/assets/icons/youtube.svg"
                    alt=""
                  />
                  <span className={styles.linkText}>
                    {extractLastSegment(user.youtube_url)}
                  </span>
                </a>
              ) : null}
            </div>
          </aside>
          <div className={styles.content}>
            <h1 className={styles.title}>
              {getFullName(user, { fallback: t("menu.profile") })}
            </h1>
            {user.description ? (
              <div
                className={`${styles.desc} markdown-body`}
                dangerouslySetInnerHTML={{
                  __html: renderMarkdown(user.description),
                }}
              />
            ) : (
              <p className={`${styles.desc} ${styles.descMuted}`}>
                {t("profilePage.noDescription", {
                  defaultValue: "Описание пока отсутствует",
                })}
              </p>
            )}

            {authoredCoursesCount > 0 ? (
              <div style={{ marginTop: 16 }}>
                <h2 style={{ margin: "0 0 10px", fontSize: 18 }}>
                  {t("profilePage.courses", { defaultValue: "Курсы автора" })}
                </h2>
                <div className={styles.coursesGrid}>
                  {pageItems.map((c) => (
                    <CourseCard key={c.id} course={c} variant="compact" />
                  ))}
                </div>
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  )
}

// moved to utils/social
