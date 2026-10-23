"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  LayoutDashboard,
  Compass,
  Route,
  FolderGit2,
  FileText,
  MessageSquareCode,
  Inbox,
  TrendingUp,
  Award,
  Layers,
  KanbanSquare,
  Workflow,
  Binary,
  Cpu,
  BookmarkCheck,
  BarChart3,
  UserCheck,
  LockKeyhole,
  BookOpen,
  Sparkles,
  Newspaper,
  BrainCircuit,
  Gauge,
  ListChecks,
  ChevronRight,
  Code2,
} from "lucide-react";

interface SidebarCategory {
  title: string;
  items: {
    label: string;
    href: string;
    icon: any;
    badge?: string;
  }[];
}

export default function Sidebar() {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let mounted = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (mounted) setIsAdmin(data.user?.app_metadata?.role === "admin");
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAdmin(session?.user.app_metadata?.role === "admin");
    });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  // The 7 understandable navigation groups
  const categories: SidebarCategory[] = [
    {
      title: "HOME",
      items: [
        { label: "Home Overview", href: "/", icon: Home },
        { label: "Public Overview", href: "/welcome", icon: LayoutDashboard, badge: "Hero" },
        { label: "Platform Features", href: "/features", icon: ListChecks, badge: "31" },
      ],
    },
    {
      title: "EXPLORE",
      items: [
        { label: "Explore All Tech Fields", href: "/catalogue", icon: Layers, badge: "30 Fields" },
        { label: "Tech Job Trends", href: "/market", icon: TrendingUp },
        { label: "News & Opportunities", href: "/opportunities", icon: Newspaper },
      ],
    },
    {
      title: "MY LEARNING",
      items: [
        { label: "Your Step-by-Step Plan", href: "/roadmap", icon: Route },
        { label: "Your Learning Progress", href: "/analytics", icon: BarChart3 },
        { label: "Sprint Tasks", href: "/sprint-planner", icon: KanbanSquare },
        { label: "Saved Pathways", href: "/bookmarks", icon: BookmarkCheck },
        { label: "Learner Profile", href: "/profile", icon: UserCheck },
      ],
    },
    {
      title: "LEARN & PRACTISE",
      items: [
        { label: "Learning Studio & Sandbox", href: "/learning", icon: BookOpen, badge: "Labs" },
        { label: "Interactive Practice & Lab", href: "/simulator", icon: Code2 },
        { label: "Check What You Know", href: "/assessment", icon: BrainCircuit },
        { label: "Problem-Solving Patterns", href: "/dsa-tracker", icon: Binary },
      ],
    },
    {
      title: "BUILD PROJECTS",
      items: [
        { label: "Build Real Projects", href: "/projects", icon: FolderGit2 },
        { label: "System Architecture", href: "/architecture", icon: Workflow },
        { label: "Public Portfolio", href: "/portfolio", icon: Award },
      ],
    },
    {
      title: "AI LEARNING GUIDE",
      items: [
        { label: "Your AI Learning Guide", href: "/mentor", icon: Sparkles, badge: "AI" },
        { label: "AI & Prompt Blueprint", href: "/ai-blueprint", icon: Cpu },
        ...(isAdmin ? [{ label: "Admin Question Inbox", href: "/admin/questions", icon: Inbox }] : []),
      ],
    },
    {
      title: "CAREERS & OPPORTUNITIES",
      items: [
        { label: "Explore Matching Careers", href: "/career-match", icon: Compass },
        { label: "Find What You Need to Learn", href: "/skill-gap", icon: Layers },
        { label: "Improve Your Resume", href: "/resume", icon: FileText },
        { label: "Interview Simulator", href: "/simulator?mode=interview", icon: MessageSquareCode },
        { label: "Readiness Diagnostic", href: "/readiness", icon: Gauge },
        { label: "Sign In / Account", href: "/auth", icon: LockKeyhole },
      ],
    },
  ];

  return (
    <aside
      className="hidden md:flex flex-col w-64 shrink-0 rounded-2xl border border-[rgba(var(--color-burgundy-rgb),0.15)] bg-[var(--color-creme-latte)] p-3.5 h-fit sticky top-20 shadow-xs transition-colors"
      aria-label="Sidebar Navigation"
    >
      <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-6.5rem)] pr-1">
        {/* Beginner Fast-Track Card */}
        <div className="rounded-xl border border-[rgba(var(--color-burgundy-rgb),0.18)] bg-[var(--surface-rose)]/60 p-3 space-y-1.5 shadow-2xs">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--color-burgundy)]">
            <Sparkles className="w-3.5 h-3.5 text-[var(--color-burgundy)] shrink-0" />
            <span>Beginner Fast-Track</span>
          </div>
          <p className="text-[10px] text-[var(--color-burgundy)]/85 leading-snug">
            New to code? Follow our step-by-step interactive lessons and live editor.
          </p>
          <Link
            href="/learning"
            className="inline-flex items-center gap-1 text-[10px] font-bold text-[var(--color-burgundy)] hover:underline pt-0.5"
          >
            Start Chapter 1 &rarr;
          </Link>
        </div>

        {/* The 7 Navigation Groups */}
        {categories.map((category) => (
          <div key={category.title} className="space-y-1">
            <h2 className="px-3 text-[10px] font-bold tracking-wider uppercase text-[var(--color-burgundy)] opacity-90">
              {category.title}
            </h2>
            <div className="space-y-0.5 pt-0.5">
              {category.items.map((item) => {
                const Icon = item.icon;
                // Active check: exact match or matching pathname prefix
                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href.split("?")[0]));

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    prefetch={false}
                    className={`relative flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-burgundy)] ${
                      isActive
                        ? "bg-[var(--surface-rose)] border border-[rgba(var(--color-dusty-rose-rgb),0.6)] text-[var(--color-burgundy)] shadow-xs"
                        : "text-[var(--color-burgundy)] hover:bg-[var(--surface-rose)]/60 hover:text-[var(--color-burgundy)]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {isActive && (
                        <span
                          className="w-1 h-3.5 rounded-full bg-[var(--color-burgundy)] shrink-0"
                          aria-hidden="true"
                        />
                      )}
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive
                            ? "text-[var(--color-burgundy)]"
                            : "text-[var(--color-flowering-chestnut)] group-hover:text-[var(--color-burgundy)]"
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge && (
                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-[var(--color-warm-ivory)] border border-[rgba(var(--color-burgundy-rgb),0.1)] text-[var(--color-burgundy)] shrink-0">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
