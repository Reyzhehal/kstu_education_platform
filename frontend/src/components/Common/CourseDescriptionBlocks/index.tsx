import { useTranslation } from "react-i18next"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import styles from "./CourseDescriptionBlocks.module.css"

type Block = { title: string; text: string }
type Props = { blocks?: Block[] }

export default function CourseDescriptionBlocks({ blocks }: Props) {
  useTranslation()
  if (!blocks || blocks.length === 0) return null
  return (
    <section className={styles.root}>
      {blocks.map((b, i) => (
        <article key={i} className={styles.block}>
          <h3 className={styles.title}>{b.title}</h3>
          <div className={`${styles.text} markdown-body`}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{b.text}</ReactMarkdown>
          </div>
        </article>
      ))}
    </section>
  )
}
