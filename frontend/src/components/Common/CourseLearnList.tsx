import { type ReactNode } from "react"

type LearnListProps = {
  title?: string
  items?: string[]
}

export default function CourseLearnList({ title = "Чему вы научитесь", items }: LearnListProps) {
  if (!items || items.length === 0) return null

  return (
    <section className="course-learn">
      <h2 className="course-learn__title">{title}</h2>
      <ul className="course-learn__list" aria-label={title}>
        {items.map((text, idx) => (
          <li key={idx} className="course-learn__item">
            <img className="course-learn__icon" src="/assets/images/list-check-mark.svg" alt="" aria-hidden="true" />
            <span className="course-learn__text">{text}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}


