import { useTranslation } from "react-i18next"
import CheckboxList from "@/components/Common/CheckboxList"
import type { LanguagePublic } from "@/client"

type CatalogFiltersProps = {
  languages: LanguagePublic[]
  selectedLanguages: number[]
  onLanguageToggle: (value: string | number) => void
  selectedLevels: number[]
  onLevelToggle: (value: string | number) => void
}

export default function CatalogFilters({
  languages,
  selectedLanguages,
  onLanguageToggle,
  selectedLevels,
  onLevelToggle,
}: CatalogFiltersProps) {
  const { t } = useTranslation()

  return (
    <aside className="catalog-filters">
      <CheckboxList
        title={t("catalog.filters.language")}
        options={languages.map((l) => ({ label: l.name, value: l.id }))}
        values={selectedLanguages}
        onToggle={onLanguageToggle}
      />
      <CheckboxList
        title={t("catalog.filters.difficulty")}
        options={[
          { label: t("catalog.difficulty.beginner"), value: 1 },
          { label: t("catalog.difficulty.intermediate"), value: 2 },
          { label: t("catalog.difficulty.advanced"), value: 3 },
        ]}
        values={selectedLevels}
        onToggle={onLevelToggle}
      />
    </aside>
  )
}

