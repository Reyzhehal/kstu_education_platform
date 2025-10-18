import { useTranslation } from "react-i18next"
import usePageTitle from "@/hooks/usePageTitle"

type Props = {
  pageKey: string
  titleKey: string
}

export default function PlaceholderTranslated({ pageKey, titleKey }: Props) {
  const { t } = useTranslation()
  usePageTitle(titleKey)
  return (
    <div style={{ padding: 24 }}>
      <h1>{t(pageKey)}</h1>
      <p>{t("common.inDev")}</p>
    </div>
  )
}
