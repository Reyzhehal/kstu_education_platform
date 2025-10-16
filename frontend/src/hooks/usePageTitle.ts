import { useEffect } from "react"
import { useTranslation } from "react-i18next"

export default function usePageTitle(key: string, vars?: Record<string, any>) {
  const { t } = useTranslation("common")
  useEffect(() => {
    document.title = t(key, vars)
  }, [t, key, JSON.stringify(vars)])
}


