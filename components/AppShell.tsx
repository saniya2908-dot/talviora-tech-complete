"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Menu, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import Breadcrumbs from "@/components/Breadcrumbs";
import Footer from "@/components/Footer";
import dynamic from "next/dynamic";

const CommandPalette = dynamic(() => import("@/components/CommandPalette"), {
  ssr: false,
});

const publicRoutes = new Set([
  "/welcome",
  "/auth",
  "/terms",
  "/privacy",
  "/accessibility",
  "/features",
]);

function PublicNavigation() {
  const [menuOpen, setMenuOpen] = useState(false);
  const links = [
    { href: "/welcome", label: "Overview" },
    { href: "/features", label: "Features" },
    { href: "/catalogue", label: "Technology catalogue" },
    { href: "/opportunities", label: "News & opportunities" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border-panel)] bg-[var(--glass-bg)] backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/welcome" className="flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-burgundy)]">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-burgundy)] font-display-serif text-sm font-bold text-[var(--color-warm-ivory)]">TT</span>
          <span className="leading-tight">
            <span className="block font-display-serif text-sm font-bold tracking-wider text-[var(--color-burgundy)]">TALVIORA TECH</span>
            <span className="block text-[9px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">AI Career Intelligence</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Public navigation">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="rounded-lg px-3 py-2 text-xs font-semibold text-[var(--text-primary)] transition hover:bg-[var(--surface-rose)] hover:text-[var(--color-burgundy)]">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 sm:flex">
          <Link href="/auth" className="rounded-lg px-3 py-2 text-xs font-semibold text-[var(--color-burgundy)] hover:bg-[var(--surface-rose)]">Sign in</Link>
          <Link href="/" className="btn-burgundy inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold">
            Open platform <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-controls="public-mobile-menu"
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          className="rounded-xl border border-[var(--border-panel)] p-2 text-[var(--color-burgundy)] sm:hidden"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {menuOpen && (
        <nav id="public-mobile-menu" className="space-y-1 border-t border-[var(--border-panel)] px-4 py-3 sm:hidden" aria-label="Mobile public navigation">
          {links.map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)} className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--surface-rose)]">
              {link.label}
            </Link>
          ))}
          <Link href="/auth" onClick={() => setMenuOpen(false)} className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-[var(--color-burgundy)] hover:bg-[var(--surface-rose)]">Sign in</Link>
          <Link href="/" onClick={() => setMenuOpen(false)} className="btn-burgundy mt-2 flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold">
            Open platform <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </nav>
      )}
    </header>
  );
}

function PreviewDataNotice() {
  return (
    <aside className="mb-5 rounded-xl border border-[rgba(var(--color-dusty-rose-rgb),0.55)] bg-[var(--surface-rose)] px-4 py-3 text-xs leading-relaxed text-[var(--text-primary)]" role="note">
      <strong className="font-bold text-[var(--color-burgundy)]">Preview workspace.</strong>{" "}
      Curriculum, role, project, and catalogue content is bundled reference material. Personal history is empty until you add it. Market and opportunity feeds are not connected; some account features may need setup.
    </aside>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublic = publicRoutes.has(pathname) || pathname.startsWith("/features/");

  const skipLink = (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2.5 focus:rounded-xl focus:bg-[var(--color-burgundy)] focus:text-[var(--color-warm-ivory)] focus:font-bold focus:shadow-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-warm-ivory)] transition"
    >
      Skip to main content
    </a>
  );

  if (isPublic) {
    return (
      <div className="flex min-h-screen flex-col">
        {skipLink}
        <PublicNavigation />
        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8 focus:outline-none"
        >
          {children}
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col justify-between">
      {skipLink}
      <div>
        <Navbar />
        <div className="mx-auto flex w-full max-w-[1720px] flex-col gap-6 px-3 py-4 sm:px-6 sm:py-6 md:flex-row lg:px-8">
          <Sidebar />
          <main
            id="main-content"
            tabIndex={-1}
            className="min-w-0 flex-1 focus:outline-none"
          >
            <PreviewDataNotice />
            <Breadcrumbs />
            {children}
          </main>
        </div>
      </div>
      <Footer />
      <CommandPalette />
    </div>
  );
}
