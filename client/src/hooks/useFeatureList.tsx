import { useTranslation } from "react-i18next";
import {
  LuListChecks,
  LuSearch,
  LuPlus,
  LuTag,
  LuSettings,
} from "react-icons/lu";
import { MdOutlineFavoriteBorder } from "react-icons/md";

export const useFeatureList = () => {
  const { t } = useTranslation();

  const features = [
    {
      title: t("features.myRecipes.title"),
      description: t("features.myRecipes.description"),
      icon: LuListChecks,
      href: "/recipes/manage",
      requiresAuth: true,
    },
    {
      title: t("features.favorites.title"),
      description: t("features.favorites.description"),
      icon: MdOutlineFavoriteBorder,
      href: "/recipes/favorites",
      requiresAuth: true,
    },
    {
      title: t("features.explore.title"),
      description: t("features.explore.description"),
      icon: LuSearch,
      href: "/recipes",
      requiresAuth: false,
    },
    {
      title: t("features.add.title"),
      description: t("features.add.description"),
      icon: LuPlus,
      href: "/recipes/add",
      requiresAuth: true,
    },
    {
      title: t("features.tags.title"),
      description: t("features.tags.description"),
      icon: LuTag,
      href: "/tags/manage",
      requiresAuth: true,
      adminOnly: true,
    },
    {
      title: t("features.tagsSuggest.title", "Tag Suggestions"),
      description: t(
        "features.tagsSuggest.description",
        "Suggest new tags to help organize recipes"
      ),
      icon: LuTag,
      href: "/tags/suggest",
      requiresAuth: true,
      adminOnly: false,
    },
    {
      title: t("features.adminRecipes.title", "Admin Recipes"),
      description: t(
        "features.adminRecipes.description",
        "View and manage all user recipes with the ability to delete if needed"
      ),
      icon: LuListChecks,
      href: "/admin/recipes",
      requiresAuth: true,
      adminOnly: false,
      ownerOnly: true,
    },
    {
      title: t("features.settings.title"),
      description: t("features.settings.description"),
      icon: LuSettings,
      href: "/settings",
      requiresAuth: true,
    },
  ];

  return features;
};
