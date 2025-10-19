import { useTranslation } from "react-i18next"
import usePageTitle from "@/hooks/usePageTitle"
import styles from "./PlaceholderTranslated.module.css"

type Props = {
  pageKey: string
  titleKey: string
}

export default function PlaceholderTranslated({ pageKey, titleKey }: Props) {
  const { t } = useTranslation()
  usePageTitle(titleKey)
  return (
    <div className={styles.container}>
      <h1>{t(pageKey)}</h1>
      <p>{t("common.inDev")}</p>
    </div>
  )
}
