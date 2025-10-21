import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query"
import { createRouter, RouterProvider } from "@tanstack/react-router"
import axios, { type AxiosResponse } from "axios"
import { StrictMode } from "react"
import ReactDOM from "react-dom/client"
import { ApiError, LoginService, OpenAPI } from "./client"
import { CustomProvider } from "./components/ui/provider"
import { routeTree } from "./routeTree.gen"
import "./i18n"
import { Suspense } from "react"
import "./styles/markdown.css"

OpenAPI.BASE = import.meta.env.VITE_API_URL

// Флаг для предотвращения бесконечного цикла refresh
let isRefreshing = false
let failedQueue: Array<{
  resolve: (value: any) => void
  reject: (error: any) => void
}> = []

const processQueue = (error: any = null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

// Response interceptor для автоматического обновления токена при 401
OpenAPI.interceptors.response.use(async (response: AxiosResponse) => {
  // Если получили 401 и это не запрос на refresh или login
  if (
    response.status === 401 &&
    !response.config.url?.includes("/login/access-token") &&
    !response.config.url?.includes("/login/refresh-token")
  ) {
    const originalConfig = response.config

    // Если уже идёт refresh, добавляем запрос в очередь
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      }).then(() => {
        // Повторяем запрос после получения нового токена
        return axios(originalConfig)
      })
    }

    isRefreshing = true

    const refreshToken = localStorage.getItem("refresh_token")

    if (!refreshToken) {
      // Нет refresh токена - редирект на login
      isRefreshing = false
      localStorage.removeItem("access_token")
      localStorage.removeItem("refresh_token")
      window.location.href = "/login"
      return response
    }

    try {
      // Пытаемся обновить токен
      const newToken = await LoginService.refreshAccessToken({
        refreshToken: refreshToken,
      })

      localStorage.setItem("access_token", newToken.access_token)

      // Обновляем TOKEN для будущих запросов
      OpenAPI.TOKEN = async () => newToken.access_token

      // Обрабатываем очередь запросов
      processQueue(null, newToken.access_token)

      isRefreshing = false

      // Повторяем оригинальный запрос с новым токеном
      return axios(originalConfig)
    } catch (err) {
      // Не удалось обновить токен - редирект на login
      processQueue(err, null)
      isRefreshing = false
      localStorage.removeItem("access_token")
      localStorage.removeItem("refresh_token")
      window.location.href = "/login"
      return response
    }
  }

  return response
})

// Устанавливаем TOKEN после настройки interceptor'а
OpenAPI.TOKEN = async () => {
  return localStorage.getItem("access_token") || ""
}

const handleApiError = (error: Error) => {
  if (error instanceof ApiError && [403].includes(error.status)) {
    // 401 обрабатывается interceptor'ом выше
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    window.location.href = "/login"
  }
}
const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: handleApiError,
  }),
  mutationCache: new MutationCache({
    onError: handleApiError,
  }),
})

const router = createRouter({ routeTree })
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <CustomProvider>
      <QueryClientProvider client={queryClient}>
        <Suspense fallback={null}>
          <RouterProvider router={router} />
        </Suspense>
      </QueryClientProvider>
    </CustomProvider>
  </StrictMode>,
)
