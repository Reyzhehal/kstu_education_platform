import { useEffect, useMemo, useState } from "react"
import { CategoriesService, type CategoryPublic, type MetaCategoryWithSubcategoriesPublic } from "@/client"
import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import styles from "./CatalogMenu.module.css"

type Props = { open: boolean; onClose: () => void }

export default function CatalogMenu({ open, onClose }: Props) {
  const { data: categoriesResp } = useQuery({
    queryKey: ["categories"],
    queryFn: () => CategoriesService.readCategories({ skip: 0, limit: 100 }),
    enabled: open,
  })

  const categories: CategoryPublic[] = categoriesResp?.data ?? []
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    if (open && categories.length && !activeId) setActiveId(categories[0].id)
  }, [open, categories, activeId])

  const { data: metaResp } = useQuery({
    queryKey: ["meta-categories", activeId],
    queryFn: () => CategoriesService.readMetaCategoriesByCategory({ categoryId: activeId!, skip: 0, limit: 100 }),
    enabled: open && Boolean(activeId),
  })

  const groups: MetaCategoryWithSubcategoriesPublic[] = useMemo(() => metaResp?.data ?? [], [metaResp])
  if (!open) return null

  return (
    <div className={styles.root} role="dialog" aria-modal="true" aria-label="Каталог">
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.panel} role="document" id="catalog-panel">
        <div className={styles.cols}>
          <aside className={styles.left} aria-label="Категории">
            <ul className={styles.list} role="listbox" aria-activedescendant={activeId ?? undefined}>
              {categories.map((c) => (
                <li key={c.id}>
                  <button className={`${styles.cat} ${activeId === c.id ? styles.catActive : ""}`} onClick={() => setActiveId(c.id)} id={c.id} role="option" aria-selected={activeId === c.id}>
                    {c.name}
                  </button>
                </li>
              ))}
            </ul>
          </aside>
          <section className={styles.right} aria-label="Подкатегории">
            {groups.map((g) => (
              <div className={styles.group} key={g.id}>
                <Link to="/catalog/meta/$id" params={{ id: g.id }} className={styles.meta} onClick={onClose}>
                  {g.name}
                </Link>
                <ul className={styles.sublist}>
                  {(g.subcategories ?? []).map((s) => (
                    <li key={s.id}>
                      <Link to="/catalog/$id" params={{ id: s.id }} className={styles.sub} onClick={onClose}>
                        {s.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        </div>
      </div>
    </div>
  )
}


