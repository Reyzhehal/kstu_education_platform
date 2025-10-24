import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query"
import { createRouter, RouterProvider } from "@tanstack/react-router"
import axios, {
  type AxiosError,
  type AxiosRequestConfig,
  type AxiosResponse,
} from "axios"
import { StrictMode, Suspense } from "react"
import ReactDOM from "react-dom/client"
import { ApiError, LoginService, OpenAPI } from "./client"
import { CustomProvider } from "./components/ui/provider"
import { routeTree } from "./routeTree.gen"
import "./i18n"
import "./styles/markdown.css"

OpenAPI.BASE = import.meta.env.VITE_API_URL

let isRefreshing = false
let refreshPromise: Promise<string> | null = null

axios.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean
    }

    const isUnauthorized =
      (error.response?.status === 401 || error.response?.status === 403) &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/login/access-token") &&
      !originalRequest.url?.includes("/login/refresh-token")

    if (isUnauthorized) {
      originalRequest._retry = true

      if (isRefreshing && refreshPromise) {
        try {
          const newToken = await refreshPromise
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`
          }
          return axios(originalRequest)
        } catch (refreshError) {
          return Promise.reject(refreshError)
        }
      }

      if (!isRefreshing) {
        isRefreshing = true
        refreshPromise = (async () => {
          const refreshToken = localStorage.getItem("refresh_token")
          if (!refreshToken) {
            isRefreshing = false
            refreshPromise = null
            localStorage.removeItem("access_token")
            localStorage.removeItem("refresh_token")
            window.location.href = "/login"
            throw new Error("No refresh token")
          }

          try {
            const newToken = await LoginService.refreshAccessToken({
              refreshToken,
            })
            localStorage.setItem("access_token", newToken.access_token)
            OpenAPI.TOKEN = async () => newToken.access_token
            isRefreshing = false
            refreshPromise = null
            return newToken.access_token
          } catch (err) {
            isRefreshing = false
            refreshPromise = null
            localStorage.removeItem("access_token")
            localStorage.removeItem("refresh_token")
            window.location.href = "/login"
            throw err
          }
        })()

        try {
          const newToken = await refreshPromise
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`
          }
          return axios(originalRequest)
        } catch (err) {
          return Promise.reject(err)
        }
      }
    }

    return Promise.reject(error)
  },
)

OpenAPI.TOKEN = async () => localStorage.getItem("access_token") || ""

const handleApiError = (error: Error) => {
  if (error instanceof ApiError && error.status === 403) {
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    window.location.href = "/login"
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 60,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
  queryCache: new QueryCache({ onError: handleApiError }),
  mutationCache: new MutationCache({ onError: handleApiError }),
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
