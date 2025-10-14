import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/profile")({
  component: () => (
    <div style={{ padding: 24 }}>
      <h1>Профиль</h1>
      <p>Страница в разработке.</p>
    </div>
  ),
})

