import styles from "./CheckboxList.module.css"

type Option = { label: string; value: string | number }

type Props = {
  title?: string
  options: Option[]
  values: Array<string | number>
  onToggle: (value: string | number) => void
}

export default function CheckboxList({
  title,
  options,
  values,
  onToggle,
}: Props) {
  return (
    <fieldset className={styles.fieldset}>
      {title ? <legend className={styles.legend}>{title}</legend> : null}
      <ul className={styles.list}>
        {options.map((opt) => {
          const id = String(opt.value)
          const checked = values.includes(opt.value)
          return (
            <li key={id}>
              <label className={styles.label}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle(opt.value)}
                />
                <span>{opt.label}</span>
              </label>
            </li>
          )
        })}
      </ul>
    </fieldset>
  )
}
