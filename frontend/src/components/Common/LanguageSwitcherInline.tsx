import { useEffect, useState } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { LanguagesService, UsersService } from "@/client"
import { useTranslation } from "react-i18next"
import i18n from "@/i18n"
import { isLoggedIn } from "@/hooks/useAuth"

type Props = {
  className?: string
}

export default function LanguageSwitcherInline({ className }: Props) {
  const { t } = useTranslation("common")
  const [selectedCode, setSelectedCode] = useState<string>(i18n.language)

  const { data } = useQuery({
    queryKey: ["languages"],
    queryFn: () => LanguagesService.readLanguages({ skip: 0, limit: 100 }),
  })
  const languages = (data as any)?.data as Array<{ id: number; name: string; code: string }>

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
        style={{
          padding: "6px 10px",
          borderRadius: 6,
          background: "var(--bg-2)",
          border: "1px solid var(--border)",
          color: "var(--text)",
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


