import { Box, Flex, Text } from "@chakra-ui/react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { AppButton } from "@/components/AppButton"
import styles from "./SidebarItems.module.css"

interface SidebarItemsProps {
  onClose?: () => void
  tab?: string
  setTab?: (tab: string) => void
  mode?: "learn" | "teach"
  onNewCourse?: () => void
}

const SidebarItems = ({
  onClose,
  tab = "learn",
  setTab,
  mode = "learn",
  onNewCourse,
}: SidebarItemsProps) => {
  const { t } = useTranslation()
  const [isCoursesOpen, setIsCoursesOpen] = useState(true)
  const [isClassesOpen, setIsClassesOpen] = useState(true)

  const learnTabs = [
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

  const teachTabs = [
    { key: "courses", label: t("tabs.courses"), icon: "📖" },
    { key: "lessons", label: t("tabs.lessons"), icon: "📝" },
    {
      key: "classes",
      label: t("tabs.classes"),
      icon: "🎓",
      hasSubmenu: true,
      submenu: [
        { key: "my-classes", label: t("tabs.myClasses") },
        { key: "my-students", label: t("tabs.myStudents") },
      ],
    },
    { key: "notifications", label: t("tabs.notifications"), icon: "🔔" },
    { key: "newsletters", label: t("tabs.newsletters"), icon: "✉️" },
  ]

  const tabs = mode === "teach" ? teachTabs : learnTabs

  return (
    <>
      {mode === "teach" && (
        <Flex px={2} pb={2}>
          <AppButton
            variant="solid"
            className={styles.newCourseBtn}
            onClick={onNewCourse}
          >
            + {t("sidebar.newCourse")}
          </AppButton>
        </Flex>
      )}
      <Text fontSize="xs" px={4} py={2} fontWeight="bold">
        {t("sidebar.menu")}
      </Text>
      <Box>
        {tabs.map((item) => {
          const isSubmenuOpen =
            item.key === "courses" ? isCoursesOpen : isClassesOpen
          const toggleSubmenu =
            item.key === "courses"
              ? () => setIsCoursesOpen(!isCoursesOpen)
              : () => setIsClassesOpen(!isClassesOpen)

          return (
            <div key={item.key}>
              <Flex px={2}>
                <AppButton
                  variant="ghost"
                  className={`${styles.menuBtn} ${item.key === tab ? styles.menuBtnActive : ""}`}
                  onClick={() => {
                    if (item.hasSubmenu) {
                      toggleSubmenu()
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
                      {isSubmenuOpen ? "▼" : "▶"}
                    </span>
                  )}
                </AppButton>
              </Flex>
              {item.hasSubmenu && isSubmenuOpen && item.submenu && (
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
          )
        })}
      </Box>
    </>
  )
}

export default SidebarItems
