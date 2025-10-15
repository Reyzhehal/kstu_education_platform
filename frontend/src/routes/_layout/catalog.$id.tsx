import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { CoursesService, LanguagesService, type LanguagePublic } from "@/client"
import { useMemo, useState, useEffect } from "react"
import CourseCard from "@/components/Common/CourseCard"
import CatalogFilters from "@/components/Common/CatalogFilters"
import Pagination from "@/components/Common/Pagination"
import useAuth from "@/hooks/useAuth"

type SearchParams = {
  q?: string
}

export const Route = createFileRoute("/_layout/catalog/$id")({
  component: CatalogBySubcategory,
  validateSearch: (search: Record<string, unknown>): SearchParams => {
    return {
      q: search.q as string | undefined,
    }
  },
})

function CatalogBySubcategory() {
  const { user } = useAuth()
  const { id } = Route.useParams()
  const { q } = Route.useSearch()
  const [page, setPage] = useState(1)
  const [langs, setLangs] = useState<number[]>([])
  const [levels, setLevels] = useState<number[]>([1, 2, 3])

  const { data: langsResp } = useQuery({ queryKey: ["langs"], queryFn: () => LanguagesService.readLanguages({ limit: 100 }) })
  const languages: LanguagePublic[] = langsResp?.data ?? []

  useEffect(() => {
    if (user?.language_id && langs.length === 0) {
      setLangs([user.language_id])
    }
  }, [user?.language_id, langs.length])

  const { data } = useQuery({
    queryKey: ["courses", id, page, langs, levels, q],
    queryFn: () => {
      return CoursesService.readCourses({ 
        subcategoryId: id, 
        skip: (page - 1) * 12, 
        limit: 12, 
        languageId: langs.length === 1 ? langs[0] : undefined, 
        difficultyLevel: levels.length === 1 ? levels[0] : undefined,
        q: q || undefined,
      })
    },
  })

  const courses = useMemo(() => data?.data ?? [], [data])
  const count = data?.count ?? 0
  const pages = Math.max(1, Math.ceil(count / 12))

  return (
    <div className="catalog-page">
      <CatalogFilters
        languages={languages}
        selectedLanguages={langs}
        onLanguageToggle={(v) => setLangs((arr) => (arr.includes(v as number) ? arr.filter((x) => x !== v) : [...arr, v as number]))}
        selectedLevels={levels}
        onLevelToggle={(v) => setLevels((arr) => (arr.includes(v as number) ? arr.filter((x) => x !== v) : [...arr, v as number]))}
      />

      <section className="catalog-results">
        <div className="courses-grid">
          {courses.map((c) => (
            <CourseCard key={c.id} course={c} />
          ))}
        </div>

        <Pagination currentPage={page} totalPages={pages} onPageChange={setPage} />
      </section>
    </div>
  )
}
