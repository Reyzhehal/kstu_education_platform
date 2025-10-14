import { useTranslation } from "react-i18next"
import { Box, Flex, Text } from "@chakra-ui/react"
import AppButton from "@/components/AppButton"

interface SidebarItemsProps {
  onClose?: () => void
  tab?: string
  setTab?: (tab: string) => void
}

const SidebarItems = ({ onClose, tab = "learn", setTab }: SidebarItemsProps) => {
  const { t } = useTranslation()
  const tabs = [
    { key: "learn", label: t("tabs.learn") },
    { key: "courses", label: t("tabs.courses") },
    { key: "progress", label: t("tabs.progress") },
    { key: "favorites", label: t("tabs.favorites") },
    { key: "wishlist", label: t("tabs.wishlist") },
    { key: "archive", label: t("tabs.archive") },
    { key: "classes", label: t("tabs.classes") },
    { key: "notifications", label: t("tabs.notifications") },
  ]

  return (
    <>
      <Text fontSize="xs" px={4} py={2} fontWeight="bold">
        {t("sidebar.menu")}
      </Text>
      <Box>
        {tabs.map((t) => (
          <Flex key={t.key} px={2}>
            <AppButton
              variant="ghost"
              className={`menu-btn${t.key === tab ? " active" : ""}`}
              onClick={() => {
                setTab?.(t.key)
                onClose?.()
              }}
            >
              {t.label}
            </AppButton>
          </Flex>
        ))}
      </Box>
    </>
  )
}

export default SidebarItems
