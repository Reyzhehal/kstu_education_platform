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
    <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
      {title ? (
        <legend style={{ fontWeight: 700, margin: "0 0 8px" }}>{title}</legend>
      ) : null}
      <ul
        style={{
          listStyle: "none",
          margin: 0,
          padding: 0,
          display: "grid",
          gap: 6,
        }}
      >
        {options.map((opt) => {
          const id = String(opt.value)
          const checked = values.includes(opt.value)
          return (
            <li key={id}>
              <label
                style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
              >
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
