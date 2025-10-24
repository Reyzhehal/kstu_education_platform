import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"
import { LanguagesService } from "@/client"
import { isLoggedIn } from "@/hooks/useAuth"
import "./main.css"
import { Header } from "@/components/Common"

// Константа для ключа запроса языков (используется везде в приложении)
export const LANGUAGES_QUERY_KEY = ["languages"]

export const Route = createFileRoute("/_layout")({
  component: Layout,
  beforeLoad: async () => {
    if (!isLoggedIn()) {
      throw redirect({
        to: "/login",
      })
    }
  },
})

function Layout() {
  // Предварительно загружаем языки при монтировании Layout
  // staleTime: Infinity означает, что данные никогда не устареют
  // и будут загружены только один раз за сессию
  const { data: languagesData } = useQuery({
    queryKey: LANGUAGES_QUERY_KEY,
    queryFn: () => LanguagesService.readLanguages(),
    staleTime: Infinity, // Языки не меняются, загружаем один раз
    gcTime: Infinity, // Храним в кэше всегда
  })

  return (
    <div>
      <Header />
      <Outlet />
    </div>
  )
}

export default Layout
