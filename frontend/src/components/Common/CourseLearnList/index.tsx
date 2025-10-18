import { useTranslation } from "react-i18next"
import styles from "./CourseLearnList.module.css"

type LearnListProps = {
  title?: string
  items?: string[]
}

export default function CourseLearnList({ title, items }: LearnListProps) {
  const { t } = useTranslation()
  if (!items || items.length === 0) return null

  return (
    <section className={styles.root}>
      <h2 className={styles.title}>{title ?? t("coursePage.youWillLearn")}</h2>
      <ul className={styles.list} aria-label={title}>
        {items.map((text, idx) => (
          <li key={idx} className={styles.item}>
            <img
              className={styles.icon}
              src="/assets/icons/list-check-mark.svg"
              alt=""
              aria-hidden="true"
            />
            <span className={styles.text}>{text}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
