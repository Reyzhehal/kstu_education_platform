import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"
import { isLoggedIn } from "@/hooks/useAuth"
import "./main.css"
import Header from "@/components/Common/Header"

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
  return (
    <div>
      <Header />
      <Outlet />
    </div>
  )
}

export default Layout
