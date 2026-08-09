import { Link, type LinkProps } from "react-router-dom";
import { useTranslation } from "@tmc/ui";
import { localizePublicPath } from "../seo/publicSeo";

export function LocalizedLink({ to, ...props }: LinkProps) {
  const { language } = useTranslation();
  const localizedTo =
    typeof to === "string" ? localizePublicPath(to, language) : to;
  return <Link to={localizedTo} {...props} />;
}
