import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"
import { LanguagesService } from "@/client"
import { isLoggedIn } from "@/hooks/useAuth"
import "./main.css"
import { Header } from "@/components/Common"

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
  const { data: languagesData } = useQuery({
    queryKey: LANGUAGES_QUERY_KEY,
    queryFn: () => LanguagesService.readLanguages(),
    staleTime: Infinity,
    gcTime: Infinity,
  })

  return (
    <div>
      <Header />
      <Outlet />
    </div>
  )
}

export default Layout
