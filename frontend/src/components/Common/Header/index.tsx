import { Link, useLocation } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import CatalogMenu from "@/components/Common/CatalogMenu"
import LanguageSelect from "@/components/LanguageSelect"
import { UserMenuDropdown } from "@/components/UserMenuDropdown"
import styles from "./Header.module.css"

export default function Header() {
  const { t } = useTranslation()
  const [isCatalogOpen, setCatalogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const location = useLocation()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const q = params.get("q")
    setSearchQuery(q || "")
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const currentPath = location.pathname
    if (!searchQuery.trim()) {
      if (currentPath.startsWith("/catalog")) window.location.href = currentPath
      return
    }
    if (currentPath.startsWith("/catalog")) {
      window.location.href = `${currentPath}?q=${encodeURIComponent(searchQuery)}`
    } else {
      window.location.href = `/catalog?q=${encodeURIComponent(searchQuery)}`
    }
  }

  return (
    <>
      <header className={styles.header}>
        <nav className={styles.nav} aria-label={t("nav.searchAria")}>
          <button
            onClick={() => setCatalogOpen((v) => !v)}
            aria-expanded={isCatalogOpen}
            aria-controls="catalog-panel"
          >
            {t("nav.catalog")}
          </button>
          <Link
            to="/main"
            className={
              location.pathname === "/main" ||
              location.pathname.startsWith("/main")
                ? styles.active
                : ""
            }
          >
            {t("nav.myLearning")}
          </Link>
          <a href="#">{t("nav.teaching")}</a>
        </nav>
        <form
          className={styles.search}
          role="search"
          aria-label={t("nav.searchAria")}
          onSubmit={handleSearch}
        >
          <input
            type="search"
            placeholder={t("nav.searchPlaceholder")!}
            aria-label={t("nav.searchAria")!}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
          <button type="submit" className={styles.pill}>
            {t("nav.searchButton")}
          </button>
        </form>
        <div className={styles.tools}>
          <LanguageSelect />
          <UserMenuDropdown />
        </div>
      </header>
      <CatalogMenu open={isCatalogOpen} onClose={() => setCatalogOpen(false)} />
    </>
  )
}
