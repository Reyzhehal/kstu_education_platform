import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { LanguagesService, UsersService as Users, UsersService } from "@/client"
import i18n from "@/i18n"
import styles from "./LanguageSelect.module.css"

type Props = {
  className?: string
}

export default function LanguageSelect({ className }: Props) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { data } = useQuery({
    queryKey: ["languages"],
    queryFn: () => LanguagesService.readLanguages({ skip: 0, limit: 100 }),
  })

  const me = useQuery({ queryKey: ["currentUser"], queryFn: Users.readUserMe })

  const setLanguage = useMutation({
    mutationFn: (payload: { language_id?: number; code?: string | null }) =>
      UsersService.setLanguageMe({ requestBody: payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] })
    },
  })

  const currentId = (me.data as any)?.language_id as number | undefined
  const languages = (data as any)?.data as any[] | undefined

  useEffect(() => {
    if (!languages || !currentId) return
    const found = languages.find((l) => l.id === currentId)
    if (found?.code && i18n.language !== found.code) {
      void i18n.changeLanguage(found.code)
    }
  }, [languages, currentId])

  return (
    <div className={className}>
      <select
        id="lang-select"
        className={styles.select}
        value={currentId ?? ""}
        onChange={(e) => {
          const id = Number(e.target.value)
          if (!Number.isNaN(id)) setLanguage.mutate({ language_id: id })
          const found = languages?.find((l) => l.id === id)
          if (found?.code) void i18n.changeLanguage(found.code)
        }}
      >
        <option value="" disabled>
          {currentId ? t("lang.choose") : t("lang.label")}
        </option>
        {(data as any)?.data?.map((lang: any) => (
          <option key={lang.id} value={String(lang.id)}>
            {lang.name}
          </option>
        ))}
      </select>
    </div>
  )
}
