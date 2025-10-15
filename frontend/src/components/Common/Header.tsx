import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useLocation, Link } from "@tanstack/react-router"
import LanguageSelect from "@/components/LanguageSelect"
import { UserMenuDropdown } from "@/components/UserMenuDropdown"
import CatalogMenu from "@/components/Common/CatalogMenu"

export default function Header() {
  const { t } = useTranslation()
  const [isCatalogOpen, setCatalogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const location = useLocation()

  // Синхронизируем searchQuery с URL параметром q
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const q = params.get("q")
    if (q) {
      setSearchQuery(q)
    } else {
      setSearchQuery("")
    }
  }, [location.pathname, location.search])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()

    const currentPath = location.pathname

    // Если поисковый запрос пустой, удаляем параметр q из URL
    if (!searchQuery.trim()) {
      if (currentPath.startsWith("/catalog")) {
        window.location.href = currentPath
      }
      return
    }

    // Если уже на странице каталога, сохраняем текущий путь и добавляем q
    if (currentPath.startsWith("/catalog")) {
      window.location.href = `${currentPath}?q=${encodeURIComponent(searchQuery)}`
    } else {
      // С любой другой страницы → на общий каталог
      window.location.href = `/catalog?q=${encodeURIComponent(searchQuery)}`
    }
  }

  return (
    <>
      <header className="header" role="banner">
        <nav className="nav" aria-label={t("nav.searchAria")}>
          <button
            onClick={() => setCatalogOpen((v) => !v)}
            aria-expanded={isCatalogOpen}
            aria-controls="catalog-panel"
          >
            {t("nav.catalog")}
          </button>
          <Link
            to="/main"
            className={location.pathname === "/main" || location.pathname.startsWith("/main") ? "active" : ""}
          >
            {t("nav.myLearning")}
          </Link>
          <a href="#">{t("nav.teaching")}</a>
        </nav>
        <form
          className="search"
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
          />
          <button type="submit" className="btn btn-pill">
            {t("nav.searchButton")}
          </button>
        </form>
        <div className="tools">
          <LanguageSelect />
          <UserMenuDropdown />
        </div>
      </header>

      <CatalogMenu open={isCatalogOpen} onClose={() => setCatalogOpen(false)} />
    </>
  )
}

