import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { CoursesService, UsersService, type CoursePublic, type UserPublic } from "@/client"
import React, { useMemo } from "react"
import { useTranslation } from "react-i18next"
import CourseCard from "@/components/Common/CourseCard"
import Pagination from "@/components/Common/Pagination"
import { withApiBase } from "@/utils"
import usePageTitle from "@/hooks/usePageTitle"

export const Route = createFileRoute("/_layout/profile/$id")({
  component: ProfileByIdPage,
})

function ProfileByIdPage() {
  const { id } = Route.useParams()
  const { t } = useTranslation("common")

  const { data: user, isLoading, isError } = useQuery<UserPublic>({
    queryKey: ["user", id],
    queryFn: () => UsersService.readUserById({ userId: id }),
  })
  usePageTitle("profilePage.title", { title: user?.full_name || user?.username || "" })
  
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
    return <div style={{ padding: 24 }}><p>Загрузка профиля…</p></div>
  }
  if (isError || !user) {
    return <div style={{ padding: 24 }}><p>Пользователь не найден</p></div>
  }

  const avatarUrl = user.avatar_image ? withApiBase(user.avatar_image) : null
  const cover = user.cover_image ? withApiBase(user.cover_image) : "/assets/images/header-img-night.png"
  const name = user.full_name || user.username || "?"

  return (
    <div className="profile-page">
      <section className="profile-cover">
        <div className="profile-cover__inner">
          <img className="profile-cover__image" src={cover} alt="" />
        </div>
      </section>

      <section className="profile-body">
        <div className="profile-layout">
          <aside className="profile-sidebar">
            {avatarUrl ? (
              <img className="profile-avatar" src={avatarUrl} alt="" />
            ) : (
              <div className="profile-avatar profile-avatar--placeholder" aria-hidden="true">
                {name.trim().charAt(0).toUpperCase()}
              </div>
            )}
            {authoredCoursesCount > 0 ? (
              <div className="profile-stats">
                <div className="profile-stat">
                  <div className="profile-stat__label">{t("profilePage.coursesCount", { defaultValue: "Курсов" })}</div>
                  <div className="profile-stat__value">{authoredCoursesCount}</div>
                </div>
              </div>
            ) : null}
          </aside>
          <div className="profile-content">
            <h1 className="profile-title">{user.full_name || user.username || t("menu.profile")}</h1>
            {user.description ? (
              <div className="profile-desc markdown-body">{user.description}</div>
            ) : (
              <p className="profile-desc is-muted">{t("profilePage.noDescription", { defaultValue: "Описание пока отсутствует" })}</p>
            )}

            {authoredCoursesCount > 0 ? (
              <div style={{ marginTop: 16 }}>
                <h2 style={{ margin: "0 0 10px", fontSize: 18 }}>{t("profilePage.courses", { defaultValue: "Курсы автора" })}</h2>
                <div className="courses-grid" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
                  {pageItems.map((c) => (
                    <CourseCard key={c.id} course={c} variant="compact" />
                  ))}
                </div>
                <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  )
}

