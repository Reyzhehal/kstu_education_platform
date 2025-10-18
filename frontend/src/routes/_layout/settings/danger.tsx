import { createFileRoute } from "@tanstack/react-router"
import DeleteAccount from "@/components/UserSettings/DeleteAccount"

export const Route = createFileRoute("/_layout/settings/danger")({
  component: DeleteAccount,
})
