import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { CoursesService, LanguagesService, type LanguagePublic } from "@/client"
import { useMemo, useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import CheckboxList from "@/components/Common/CheckboxList"
import useAuth from "@/hooks/useAuth"

export const Route = createFileRoute("/_layout/catalog/meta/$id")({
  component: CatalogByMeta,
})

function CatalogByMeta() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { id } = Route.useParams()
  const [page, setPage] = useState(1)
  const [langs, setLangs] = useState<number[]>([])
  const [levels, setLevels] = useState<number[]>([1, 2, 3])
  const apiUrl = import.meta.env.VITE_API_URL || ""

  const { data: langsResp } = useQuery({ queryKey: ["langs"], queryFn: () => LanguagesService.readLanguages({ limit: 100 }) })
  const languages: LanguagePublic[] = langsResp?.data ?? []

  // Устанавливаем язык пользователя по умолчанию после загрузки
  useEffect(() => {
    if (user?.language_id && langs.length === 0) {
      setLangs([user.language_id])
    }
  }, [user?.language_id, langs.length])

  const { data } = useQuery({
    queryKey: ["courses", "meta", id, page, langs, levels],
    queryFn: () =>
      CoursesService.readCourses({ 
        metaCategoryId: id, 
        skip: (page - 1) * 12, 
        limit: 12, 
        languageId: langs.length === 1 ? langs[0] : undefined, 
        difficultyLevel: levels.length === 1 ? levels[0] : undefined 
      }),
  })

  const courses = useMemo(() => data?.data ?? [], [data])
  const count = data?.count ?? 0
  const pages = Math.max(1, Math.ceil(count / 12))

  return (
    <div className="catalog-page">
      <aside className="catalog-filters">
        <CheckboxList
          title={t("catalog.filters.language")}
          options={languages.map((l) => ({ label: l.name, value: l.id }))}
          values={langs}
          onToggle={(v) => setLangs((arr) => (arr.includes(v as number) ? arr.filter((x) => x !== v) : [...arr, v as number]))}
        />
        <CheckboxList
          title={t("catalog.filters.difficulty")}
          options={[
            { label: t("catalog.difficulty.beginner"), value: 1 },
            { label: t("catalog.difficulty.intermediate"), value: 2 },
            { label: t("catalog.difficulty.advanced"), value: 3 },
          ]}
          values={levels}
          onToggle={(v) => setLevels((arr) => (arr.includes(v as number) ? arr.filter((x) => x !== v) : [...arr, v as number]))}
        />
      </aside>

      <section className="catalog-results">
        <div className="courses-grid">
          {courses.map((c) => {
            const coverImage = c.cover_image ? `${apiUrl}/${c.cover_image}` : "/assets/images/header-img-night.png"
            return (
              <div className="course-card" key={c.id}>
                <img className="course-card__img" src={coverImage} alt="" />
                <div className="course-card__body">
                  <div className="course-card__title">{c.title}</div>
                  <div className="course-card__desc">{c.description ?? ""}</div>
                  <div className="course-card__meta">{c.hours_total ?? 0} {t("catalog.course.hoursTotal")}</div>
                </div>
                <button className="course-card__like" title={t("catalog.course.wishlist")} aria-label={t("catalog.course.wishlist")}>❤</button>
              </div>
            )
          })}
        </div>

        <div className="pagination">
          {Array.from({ length: pages }, (_, i) => i + 1).slice(0, pages).map((p) => (
            <button key={p} className={`page-btn ${p === page ? "is-active" : ""}`} onClick={() => setPage(p)}>
              {p}
            </button>
          ))}
          {page < pages && (
            <button className="page-btn" onClick={() => setPage(page + 1)}>{t("catalog.pagination.next")}</button>
          )}
        </div>
      </section>
    </div>
  )
}
