import { useEffect, useState } from "react";
import { AppLink } from "@/components/common/AppLink";
import { ChevronDown, Menu, Moon, Search, Sun, X } from "lucide-react";
import { mobileNav, primaryNav, type NavItem } from "@/lib/navigation";
import { useTheme } from "@/hooks/use-theme";
import { SearchBox } from "./SearchBox";
import { ContactQuickMenu } from "@/components/common/ContactQuickMenu";

function MegaMenu({ item }: { item: NavItem }) {
  if (!item.columns) return null;
  return (
    <div className="invisible absolute left-1/2 top-full z-50 w-[min(58rem,calc(100vw-3rem))] -translate-x-1/2 pt-3 opacity-0 transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
      <div className="surface-card grid gap-8 p-7 md:grid-cols-[repeat(auto-fit,minmax(11rem,1fr))]">
        {item.columns.map((col) => (
          <div key={col.heading}>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {col.heading}
            </p>
            <ul className="space-y-1">
              {col.links.map((link) => (
                <li key={link.label + link.href}>
                  <AppLink
                    to={link.href}
                    className="block rounded-lg px-2 py-1.5 text-sm font-medium text-foreground/85 transition-colors hover:bg-brand-soft hover:text-foreground"
                  >
                    {link.label}
                    {link.description && (
                      <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                        {link.description}
                      </span>
                    )}
                  </AppLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
        {item.featured && (
          <AppLink
            to={item.featured.href}
            className="flex flex-col justify-between rounded-xl bg-brand-soft p-5 transition-colors hover:bg-brand-soft/70"
          >
            <div>
              <p className="text-sm font-semibold">{item.featured.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{item.featured.description}</p>
            </div>
            <span className="mt-4 text-xs font-semibold text-brand">{item.featured.cta} →</span>
          </AppLink>
        )}
      </div>
    </div>
  );
}

export function Header() {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { theme, toggle, mounted } = useTheme();

  // Never leave the sheet open behind a resize into the desktop layout.
  useEffect(() => {
    if (!open) return;
    const mq = window.matchMedia("(min-width: 1280px)");
    const onChange = () => mq.matches && setOpen(false);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-xl">
      <div className="container-page flex h-[4.5rem] items-center gap-3 lg:h-[5.25rem] lg:gap-4">
        <AppLink to="/" className="flex min-w-0 shrink-0 items-center" aria-label="Degreekhojo home">
          <img
            src="/degreekhojo-logo.png"
            alt="Degreekhojo logo"
            width={180}
            height={48}
            className="h-14 w-auto object-contain sm:h-16 lg:h-[4.75rem]"
          />
        </AppLink>

        <nav className="hidden flex-1 items-center justify-center xl:flex" aria-label="Primary">
          <ul className="flex items-center gap-0.5">
            {primaryNav.map((item) => (
              <li key={item.label} className="group static">
                <AppLink
                  to={item.href}
                  className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm font-semibold text-foreground/80 transition-colors hover:bg-secondary hover:text-foreground"
                  activeProps={{ className: "bg-brand-soft text-brand" }}
                >
                  {item.label}
                  {item.columns && <ChevronDown className="h-3.5 w-3.5 opacity-60" />}
                </AppLink>
                <MegaMenu item={item} />
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <AppLink
            to="/courses"
            className="hidden rounded-full px-3 py-2 text-sm font-semibold text-foreground/80 transition-colors hover:bg-secondary hover:text-foreground lg:inline-flex"
            activeProps={{ className: "bg-brand-soft text-brand" }}
          >
            Explore Programs
          </AppLink>
          <AppLink
            to="/universities"
            className="hidden rounded-full px-3 py-2 text-sm font-semibold text-foreground/80 transition-colors hover:bg-secondary hover:text-foreground lg:inline-flex"
            activeProps={{ className: "bg-brand-soft text-brand" }}
          >
            Top Universities
          </AppLink>
          <div className="hidden w-52 lg:block xl:w-56">
            <SearchBox placeholder="Search…" />
          </div>
          <button
            type="button"
            onClick={() => setSearchOpen((v) => !v)}
            aria-label="Toggle search"
            aria-expanded={searchOpen}
            className="btn-icon lg:hidden"
          >
            {searchOpen ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={toggle}
            aria-label="Toggle colour theme"
            className="btn-icon hidden sm:grid"
          >
            {mounted && theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <AppLink to="/contact" className="btn btn-primary hidden sm:inline-flex">
            Get guidance
          </AppLink>
          <ContactQuickMenu />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={open}
            className="btn-icon xl:hidden"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {searchOpen && (
        <div className="border-t border-border bg-background px-4 py-3 lg:hidden">
          <SearchBox />
        </div>
      )}

      {open && (
        <div className="max-h-[calc(100dvh-4.5rem)] overflow-y-auto border-t border-border bg-background xl:hidden">
          <nav aria-label="Mobile" className="container-page py-4">
            <ul className="grid gap-1 sm:grid-cols-2">
              {mobileNav.map((link) => (
                <li key={link.href + link.label}>
                  <AppLink
                    to={link.href}
                    onClick={() => setOpen(false)}
                    className="flex min-h-11 items-center rounded-xl px-3 text-[0.95rem] font-semibold text-foreground/90 transition-colors hover:bg-secondary"
                    activeProps={{ className: "bg-brand-soft text-brand" }}
                  >
                    {link.label}
                  </AppLink>
                </li>
              ))}
            </ul>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <AppLink to="/contact" onClick={() => setOpen(false)} className="btn btn-primary w-full">
                Get guidance
              </AppLink>
              <button type="button" onClick={toggle} className="btn btn-secondary w-full sm:hidden">
                {mounted && theme === "dark" ? "Light mode" : "Dark mode"}
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
