type Props = {
  title: string
  options: { label: string; value: string | number }[]
  values: (string | number)[]
  onToggle: (v: string | number) => void
}

export default function CheckboxList({ title, options, values, onToggle }: Props) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>{title}</div>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 6 }}>
        {options.map((o) => (
          <li key={o.value}>
            <label style={{ display: "flex", gap: 8, alignItems: "center", cursor: "pointer" }}>
              <input type="checkbox" checked={values.includes(o.value)} onChange={() => onToggle(o.value)} />
              <span>{o.label}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  )
}

