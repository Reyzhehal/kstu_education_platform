import { Box, Flex, Text } from "@chakra-ui/react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { AppButton } from "@/components/AppButton"
import styles from "./SidebarItems.module.css"

interface SidebarItemsProps {
  onClose?: () => void
  tab?: string
  setTab?: (tab: string) => void
}

const SidebarItems = ({
  onClose,
  tab = "learn",
  setTab,
}: SidebarItemsProps) => {
  const { t } = useTranslation()
  const [isCoursesOpen, setIsCoursesOpen] = useState(true)

  const tabs = [
    { key: "learn", label: t("tabs.learn"), icon: "🏠" },
    {
      key: "courses",
      label: t("tabs.courses"),
      icon: "📖",
      hasSubmenu: true,
      submenu: [
        { key: "progress", label: t("tabs.progress") },
        { key: "favorites", label: t("tabs.favorites") },
        { key: "archive", label: t("tabs.archive") },
      ],
    },
    { key: "classes", label: t("tabs.classes"), icon: "🎓" },
    { key: "notifications", label: t("tabs.notifications"), icon: "🔔" },
  ]

  return (
    <>
      <Text fontSize="xs" px={4} py={2} fontWeight="bold">
        {t("sidebar.menu")}
      </Text>
      <Box>
        {tabs.map((item) => (
          <div key={item.key}>
            <Flex px={2}>
              <AppButton
                variant="ghost"
                className={`${styles.menuBtn} ${item.key === tab ? styles.menuBtnActive : ""}`}
                onClick={() => {
                  if (item.hasSubmenu) {
                    setIsCoursesOpen(!isCoursesOpen)
                  } else {
                    setTab?.(item.key)
                    onClose?.()
                  }
                }}
              >
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    flex: 1,
                  }}
                >
                  {item.icon && <span>{item.icon}</span>}
                  <span>{item.label}</span>
                </span>
                {item.hasSubmenu && (
                  <span style={{ fontSize: "0.8em" }}>
                    {isCoursesOpen ? "▼" : "▶"}
                  </span>
                )}
              </AppButton>
            </Flex>
            {item.hasSubmenu && isCoursesOpen && item.submenu && (
              <Box pl={4}>
                {item.submenu.map((subitem) => (
                  <Flex key={subitem.key} px={2}>
                    <AppButton
                      variant="ghost"
                      className={`${styles.menuBtn} ${styles.submenuBtn} ${subitem.key === tab ? styles.menuBtnActive : ""}`}
                      onClick={() => {
                        setTab?.(subitem.key)
                        onClose?.()
                      }}
                    >
                      {subitem.label}
                    </AppButton>
                  </Flex>
                ))}
              </Box>
            )}
          </div>
        ))}
      </Box>
    </>
  )
}

export default SidebarItems
