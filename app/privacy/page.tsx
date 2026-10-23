import { ShieldCheck, Lock } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div className="pb-4 border-b border-[var(--color-creme-latte)]">
        <h1 className="font-display-serif text-3xl sm:text-4xl font-bold text-[var(--color-burgundy)]">
          Privacy & Data Use
        </h1>
        <p className="text-xs text-[var(--color-burgundy)]/80 mt-1">
          Preview implementation notes · Updated October 12, 2026
        </p>
      </div>

      <div className="bg-[var(--color-warm-ivory)] rounded-2xl p-6 sm:p-8 space-y-6 text-xs sm:text-sm text-[var(--color-burgundy)]/80 leading-relaxed border border-[var(--color-creme-latte)] shadow-xs">
        <section className="space-y-2">
          <h2 className="font-display-serif font-bold text-base text-[var(--color-burgundy)]">1. Browser storage</h2>
          <p>
            This project stores theme choice, roadmap and pattern checklists, bookmarks, sprint tasks, and recent assessment output in browser storage. These values remain on that browser unless you clear its site data.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display-serif font-bold text-base text-[var(--color-burgundy)]">2. Account storage</h2>
          <p>
            When Supabase is configured and you sign in, profile, task, bookmark, and assessment requests can be saved to that Supabase project. Database access depends on the deployed schema and policies. Review the deployment's Supabase settings and policies before use.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display-serif font-bold text-base text-[var(--color-burgundy)]">3. AI requests</h2>
          <p>
            Assessment answers, mentor messages, and interview practice answers are sent to Google Gemini when the AI key is configured. When the question inbox is enabled, each new mentor question is also saved in the site database and can be read or deleted by an authorized Talviora administrator. AI replies and the rest of the conversation are not placed in that admin inbox. Questions remain there until an admin deletes them. Do not include sensitive personal information. Provider processing and retention follow Google's current terms and policies; this project makes no separate retention guarantee.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display-serif font-bold text-base text-[var(--color-burgundy)]">4. Deployment responsibility</h2>
          <p>Hosting, logs, backups, analytics, and retention can vary by deployment. This source project does not include an analytics or advertising integration; inspect your hosting and provider configuration for the behavior of a deployed site.</p>
        </section>
      </div>
    </div>
  );
}
