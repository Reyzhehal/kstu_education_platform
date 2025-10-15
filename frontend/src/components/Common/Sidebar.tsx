import SidebarItems from "./SidebarItems"

type Props = { tab?: string; setTab?: (tab: string) => void }

export default function Sidebar({ tab, setTab }: Props) {
  return (
    <aside className="sidebar" aria-label="Sidebar">
      <div className="sidebar__hero" aria-hidden="true" />
      <ul className="menu">
        <SidebarItems tab={tab} setTab={setTab} />
      </ul>
    </aside>
  )
}


