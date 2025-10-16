import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { useTranslation } from "react-i18next"
type Block = {
  title: string
  text: string
}

type Props = {
  blocks?: Block[]
}

export default function CourseDescriptionBlocks({ blocks }: Props) {
  useTranslation()
  if (!blocks || blocks.length === 0) return null

  return (
    <section className="course-blocks">
      {blocks.map((b, i) => (
        <article key={i} className="course-block">
          <h3 className="course-block__title">{b.title}</h3>
          <div className="course-block__text markdown-body">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{b.text}</ReactMarkdown>
          </div>
        </article>
      ))}
    </section>
  )
}


