import { useTranslation } from "react-i18next"

type Props = {
  isEnrolled?: boolean
  isLoading?: boolean
  onEnroll: () => void
  onUnenroll: () => void
}

export default function EnrollButton({ isEnrolled, isLoading, onEnroll, onUnenroll }: Props) {
  const { t } = useTranslation()
  const label = isEnrolled ? t("coursePage.unenroll", { defaultValue: "Отписаться" }) : t("coursePage.enroll", { defaultValue: "Записаться" })
  const className = `enroll-btn ${isEnrolled ? "enroll-btn--enrolled" : "enroll-btn--not"}`

  return (
    <button
      type="button"
      className={className}
      onClick={isEnrolled ? onUnenroll : onEnroll}
      disabled={isLoading}
      aria-label={label}
    >
      {label}
    </button>
  )
}


