import { createFileRoute } from "@tanstack/react-router"
import { useMemo, useState } from "react"
import AppButton from "@/components/AppButton"
import "./main.css"
import LanguageSelect from "@/components/LanguageSelect"

export const Route = createFileRoute("/main")({
  component: MainPage,
})

function MainPage() {
  const tabs = useMemo(
    () => [
      { key: "learn", label: "Моё обучение" },
      { key: "courses", label: "Курсы" },
      { key: "progress", label: "Прохожу" },
      { key: "favorites", label: "Избранные" },
      { key: "wishlist", label: "Хочу пройти" },
      { key: "archive", label: "Архив" },
      { key: "classes", label: "Классы" },
      { key: "notifications", label: "Уведомления" },
    ],
    []
  )
  const [tab, setTab] = useState<string>("learn")

  const currentLabel = tabs.find((t) => t.key === tab)?.label ?? tabs[0].label
  const renderContent = () => {
    switch (tab) {
      case "courses":
        return <p>Список курсов появится здесь.</p>
      case "progress":
        return <p>Ваш прогресс по курсам.</p>
      case "favorites":
        return <p>Избранные курсы.</p>
      case "wishlist":
        return <p>Курсы, которые вы хотите пройти.</p>
      case "archive":
        return <p>Архив пройденных курсов.</p>
      case "classes":
        return <p>Ваши классы.</p>
      case "notifications":
        return <p>Ваши уведомления.</p>
      default:
        return <p>Добро пожаловать! Здесь будет лента обучения.</p>
    }
  }
  return (
    <div>
      <header className="header" role="banner">
        <nav className="nav" aria-label="Главное меню">
          <a href="#">Каталог</a>
          <a href="#" className="active">Моё обучение</a>
          <a href="#">Преподавание</a>
        </nav>
        <form className="search" role="search" aria-label="Поиск по сайту" onSubmit={(e) => e.preventDefault()}>
          <input type="search" placeholder="Поиск…" aria-label="Поиск" />
        </form>
        <div className="tools">
          <LanguageSelect />
          <span className="avatar" aria-hidden="true">R</span>
        </div>
      </header>

      <div className="container" role="main">
        <aside className="sidebar" aria-label="Навигация обучения">
          <div className="sidebar__hero" aria-hidden="true" />
          <ul className="menu">
            {tabs.map((t) => (
              <li key={t.key}>
                <AppButton
                  variant="ghost"
                  className={`menu-btn${t.key === tab ? ` active` : ``}`}
                  onClick={() => setTab(t.key)}
                >
                  {t.label}
                </AppButton>
              </li>
            ))}
          </ul>
        </aside>

        <main className="content">
          <h1>{currentLabel} – Политех</h1>
          {renderContent()}
        </main>
      </div>
    </div>
  )
}

