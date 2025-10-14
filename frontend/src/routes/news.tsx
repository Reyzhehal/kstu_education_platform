import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/news")({
  component: () => (
    <div style={{ padding: 24 }}>
      <h1>Что нового</h1>
      <p>Страница в разработке.</p>
    </div>
  ),
})

