"use client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslations } from "next-intl";
import { useRouter, usePathname } from "next/navigation";

/**
 * @author Raffael Elias Schäfer
 */
export function LocaleSelector() {
  const locales = ["de", "en"];
  const t = useTranslations("LocaleSelector");
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = pathname.split("/")[1] || locales[0];

  const handleLocaleChange = (newLocale: string) => {
    const pathWithoutLocale = pathname.replace(/^\/[^\/]+/, "") || "/";
    const newPath = `/${newLocale}${pathWithoutLocale}`;
    router.push(newPath);
  };

  return (
    <Select onValueChange={handleLocaleChange} defaultValue={currentLocale}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder={t("placeholder")} />
      </SelectTrigger>
      <SelectContent>
        {locales.map((locale) => (
          <SelectItem key={locale} value={locale}>
            {t(locale)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
