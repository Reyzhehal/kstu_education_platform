import SidebarItems from "../SidebarItems"
import styles from "./Sidebar.module.css"

type Props = { tab?: string; setTab?: (tab: string) => void }

export default function Sidebar({ tab, setTab }: Props) {
  return (
    <aside className={styles.root} aria-label="Sidebar">
      <div className={styles.hero} aria-hidden="true" />
      <ul className={styles.menu}>
        <SidebarItems tab={tab} setTab={setTab} />
      </ul>
    </aside>
  )
}
