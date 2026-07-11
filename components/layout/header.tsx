// coding-standard: maintained
import { LocationSwitcher } from "@/ui/components/LocationSwitcher";
import { Separator } from "@ui/components/separator";
import { SidebarTrigger } from "@ui/components/sidebar";
import { Breadcrumbs } from "../breadcrumbs";
import SearchInput from "../search-input";
import { LanguageToggle } from "./language-toggle";
import { ModeToggle } from "./ThemeToggle/theme-toggle";

export default function Header() {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumbs />
      </div>

      <div className="flex items-center gap-2 px-4">
        {/* <CtaGithub /> */}
        <div className="hidden md:flex">
          <SearchInput />
        </div>
        <ModeToggle />
        <LanguageToggle />
        <LocationSwitcher />
      </div>
    </header>
  );
}
