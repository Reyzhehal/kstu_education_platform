import { useQuery } from "@tanstack/react-query"
import { CategoriesService, type CategoryPublic, type SubcategoryPublic } from "@/client"

export const useCategories = () => {
  const { data: categoriesResp, isLoading: isCategoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: () => CategoriesService.readCategories({ skip: 0, limit: 100 }),
  })

  const categories: CategoryPublic[] = categoriesResp?.data ?? []
  const firstCategoryId = categories[0]?.id

  const { data: subResp, isLoading: isSubLoading } = useQuery({
    queryKey: ["subcategories", firstCategoryId],
    queryFn: () =>
      CategoriesService.readSubcategoriesByCategory({ categoryId: firstCategoryId!, skip: 0, limit: 100 }),
    enabled: Boolean(firstCategoryId),
  })

  const subcategories: SubcategoryPublic[] = subResp?.data ?? []

  return {
    categories,
    subcategories,
    isLoading: isCategoriesLoading || isSubLoading,
  }
}

export default useCategories


