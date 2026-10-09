"use client";

import Link from "next/link";
import { useRecentSessions } from "@/lib/recent-sessions";
import { Clock3, ArrowUpRight } from "lucide-react";
import { useTranslation } from "@/i18n/config";

export default function RecentSessionsPage() {
  const sessions = useRecentSessions();
  const { locale } = useTranslation();
  const th = locale === "th";

  return (
    <main className="mx-auto w-full max-w-4xl space-y-6 py-6">
      <header>
        <h1 className="text-2xl font-bold">{th ? "เซสชันที่เข้าชมล่าสุด" : "Recently viewed sessions"}</h1>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          {th ? "บันทึกเฉพาะบนเบราว์เซอร์นี้ ไม่ต้องเข้าสู่ระบบและไม่มีการติดตามผู้ใช้" : "Saved only in this browser. No account or tracking required."}
        </p>
      </header>

      {!sessions.length ? (
        <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-1)] p-8 text-center">
          <Clock3 aria-hidden="true" className="mx-auto mb-3 h-8 w-8 opacity-50" />
          <p className="text-sm text-[var(--color-text-secondary)]">{th ? "เมื่อคุณเปิดดูเซสชันการแข่งขัน ประวัติจะแสดงที่นี่" : "Your recently opened sessions will appear here."}</p>
          <Link href="/season" className="mt-4 inline-block text-sm underline">{th ? "สำรวจฤดูกาล" : "Explore races"}</Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {sessions.map(session => (
            <Link key={session.key} href={`/session?key=${session.key}`}
              className="flex items-center justify-between gap-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-1)] p-4 hover:border-[var(--color-border-strong)]">
              <div className="min-w-0">
                <h2 className="truncate font-semibold">{session.name}</h2>
                <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                  {session.circuit || (th ? "ไม่ทราบสนาม" : "Unknown circuit")} · {th ? "เข้าชม" : "Viewed"} {new Date(session.viewedAt).toLocaleString(th ? "th-TH-u-ca-gregory" : "en-GB")}
                </p>
              </div>
              <ArrowUpRight className="h-5 w-5 shrink-0" aria-hidden="true" />
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
