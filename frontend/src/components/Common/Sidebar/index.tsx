import SidebarItems from "../SidebarItems"
import styles from "./Sidebar.module.css"

type Props = {
  tab?: string
  setTab?: (tab: string) => void
  mode?: "learn" | "teach"
  onNewCourse?: () => void
}

export default function Sidebar({
  tab,
  setTab,
  mode = "learn",
  onNewCourse,
}: Props) {
  const heroImage =
    mode === "teach"
      ? "/assets/images/header-img-night-2.png"
      : "/assets/images/header-img-night.png"

  return (
    <aside className={styles.root} aria-label="Sidebar">
      <div
        className={styles.hero}
        style={{ backgroundImage: `url(${heroImage})` }}
        aria-hidden="true"
      />
      <ul className={styles.menu}>
        <SidebarItems
          tab={tab}
          setTab={setTab}
          mode={mode}
          onNewCourse={onNewCourse}
        />
      </ul>
    </aside>
  )
}
