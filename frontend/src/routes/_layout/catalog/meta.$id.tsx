import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useEffect, useMemo, useState } from "react"
import { CoursesService, type LanguagePublic, LanguagesService } from "@/client"
import { CatalogFilters, CourseCard, Pagination } from "@/components/Common"
import useAuth from "@/hooks/useAuth"
import { LANGUAGES_QUERY_KEY } from "@/routes/_layout"
import styles from "./index.module.css"

type SearchParams = {
  q?: string
}

export const Route = createFileRoute("/_layout/catalog/meta/$id")({
  component: CatalogByMeta,
  validateSearch: (search: Record<string, unknown>): SearchParams => {
    return {
      q: search.q as string | undefined,
    }
  },
})

function CatalogByMeta() {
  const { user } = useAuth()
  const { id } = Route.useParams()
  const { q } = Route.useSearch()
  const [page, setPage] = useState(1)
  const [langs, setLangs] = useState<number[]>([])
  const [levels, setLevels] = useState<number[]>([1, 2, 3])

  // Используем языки из глобального кэша (уже загружены в Layout)
  const { data: langsResp } = useQuery({
    queryKey: LANGUAGES_QUERY_KEY,
    queryFn: () => LanguagesService.readLanguages({ limit: 100 }),
    staleTime: Infinity,
  })
  const languages: LanguagePublic[] = langsResp?.data ?? []

  useEffect(() => {
    if (user?.language_id && langs.length === 0) {
      setLangs([user.language_id])
    }
  }, [user?.language_id, langs.length])

  const { data } = useQuery({
    queryKey: ["courses", "meta", id, page, langs, levels, q],
    queryFn: () =>
      CoursesService.readCourses({
        metaCategoryId: id,
        skip: (page - 1) * 12,
        limit: 12,
        languageId: langs.length === 1 ? langs[0] : undefined,
        difficultyLevel: levels.length === 1 ? levels[0] : undefined,
        q: q || undefined,
      }),
  })

  const courses = useMemo(() => data?.data ?? [], [data])
  const count = data?.count ?? 0
  const pages = Math.max(1, Math.ceil(count / 12))

  return (
    <div className={styles.page}>
      <CatalogFilters
        languages={languages}
        selectedLanguages={langs}
        onLanguageToggle={(v) =>
          setLangs((arr) =>
            arr.includes(v as number)
              ? arr.filter((x) => x !== v)
              : [...arr, v as number],
          )
        }
        selectedLevels={levels}
        onLevelToggle={(v) =>
          setLevels((arr) =>
            arr.includes(v as number)
              ? arr.filter((x) => x !== v)
              : [...arr, v as number],
          )
        }
      />

      <section className={styles.results}>
        <div className={styles.grid}>
          {courses.map((c) => (
            <CourseCard key={c.id} course={c} />
          ))}
        </div>

        <Pagination
          currentPage={page}
          totalPages={pages}
          onPageChange={setPage}
        />
      </section>
    </div>
  )
}
