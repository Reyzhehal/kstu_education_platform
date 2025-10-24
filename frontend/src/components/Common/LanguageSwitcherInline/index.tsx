import { useMutation, useQuery } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { LanguagesService, UsersService } from "@/client"
import { isLoggedIn } from "@/hooks/useAuth"
import i18n from "@/i18n"
import { LANGUAGES_QUERY_KEY } from "@/routes/_layout"
import styles from "./LanguageSwitcherInline.module.css"

type Props = {
  className?: string
}

export default function LanguageSwitcherInline({ className }: Props) {
  const { t } = useTranslation("common")
  const [selectedCode, setSelectedCode] = useState<string>(i18n.language)

  // Используем языки из глобального кэша (уже загружены в Layout)
  const { data } = useQuery({
    queryKey: LANGUAGES_QUERY_KEY,
    queryFn: () => LanguagesService.readLanguages({ skip: 0, limit: 100 }),
    staleTime: Infinity,
  })
  const languages = (data as any)?.data as Array<{
    id: number
    name: string
    code: string
  }>

  const setLanguage = useMutation({
    mutationFn: (payload: { language_id?: number; code?: string | null }) =>
      UsersService.setLanguageMe({ requestBody: payload }),
  })

  useEffect(() => {
    const stored = localStorage.getItem("preferred_lang_code")
    if (stored && stored !== i18n.language) {
      void i18n.changeLanguage(stored)
      setSelectedCode(stored)
    }
  }, [])

  return (
    <div className={className}>
      <select
        className={styles.select}
        aria-label={t("lang.choose") || "Choose language"}
        value={selectedCode}
        onChange={async (e) => {
          const code = e.target.value
          setSelectedCode(code)
          localStorage.setItem("preferred_lang_code", code)
          void i18n.changeLanguage(code)
          if (isLoggedIn()) {
            const lang = languages?.find((l) => l.code === code)
            if (lang) setLanguage.mutate({ language_id: lang.id, code })
          }
        }}
      >
        {languages?.map((lang) => (
          <option key={lang.id} value={lang.code}>
            {lang.name}
          </option>
        ))}
      </select>
    </div>
  )
}
