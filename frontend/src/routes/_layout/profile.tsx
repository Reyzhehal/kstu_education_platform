import { createFileRoute } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
import { useQuery } from "@tanstack/react-query"
import { UsersService } from "@/client"

export const Route = createFileRoute("/_layout/profile")({
  component: ProfilePage,
})

function ProfilePage() {
  const { t } = useTranslation()
  
  return (
    <div style={{ padding: 24 }}>
      <h1>{t("menu.profile")}</h1>
      <p>{t("common.inDev")}</p>
    </div>
  )
}
