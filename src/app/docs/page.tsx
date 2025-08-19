"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FloatingDock } from "@/components/ui/floating-dock";
import { Github, Home as HomeIcon, Mail, BookOpen } from "lucide-react";

export default function DocsPage() {
  return (
    <div className="min-h-dvh flex items-center justify-center p-6 pb-28 bg-[radial-gradient(1200px_800px_at_50%_-100px,theme(colors.violet.100/.7),transparent),_linear-gradient(to_bottom,white,theme(colors.slate.50))] dark:bg-[radial-gradient(1200px_800px_at_50%_-100px,theme(colors.violet.900/.4),transparent),_linear-gradient(to_bottom,theme(colors.slate.950),theme(colors.slate.900))]">
      <Card className="w-full max-w-2xl border border-border/80 bg-card/95 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <CardHeader>
          <CardTitle className="text-3xl md:text-4xl font-semibold tracking-tight">Docs</CardTitle>
          <CardDescription>What you can do with Thymestamp</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose dark:prose-invert max-w-none">
            <p>
              Thymestamp helps you generate friendly, readable timestamps for journals, notes, and emails.
              Use the Custom Format input to craft your ideal string using tokens.
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Basic: {"{day}"}, {"{day-abb}"}, {"{month}"}, {"{month-abb}"}, {"{date}"}, {"{year}"}, {"{year-short}"}
              </li>
              <li>
                Numeric: {"{month-num}"}, {"{month-num-pad}"}
              </li>
              <li>
                Time (12h): {"{time}"}, {"{hours}"}, {"{minutes}"}, {"{seconds}"}, {"{period}"}
              </li>
              <li>
                Time (24h): {"{time24}"}, {"{hours24}"}, {"{minutes}"}, {"{seconds}"}, {"{milliseconds}"}
              </li>
              <li>
                Calendar: {"{week}"}, {"{iso-week}"}, {"{quarter}"}, {"{season}"}
              </li>
              <li>
                Timezone: {"{timezone}"}, {"{utc-offset}"}, {"{timezone-full}"}
              </li>
              <li>
                Relative: {"{relative}"}
              </li>
              <li>The preview updates live. Click Copy to copy the formatted string.</li>
              <li>Refresh updates the time to the current minute.</li>
            </ul>
            <p className="text-sm text-muted-foreground mt-4">
              Tip: Hours are shown in 12-hour format; {"{period}"} becomes AM or PM.
            </p>
          </div>
        </CardContent>
      </Card>

      <FloatingDock
        items={[
          { title: "Home", icon: <HomeIcon className="h-5 w-5" />, href: "/" },
          { title: "Docs", icon: <BookOpen className="h-5 w-5" />, href: "/docs" },
          { title: "GitHub", icon: <Github className="h-5 w-5" />, href: "#" },
          { title: "Contact", icon: <Mail className="h-5 w-5" />, href: "#" },
        ]}
        desktopClassName="fixed bottom-6 left-1/2 -translate-x-1/2"
        mobileClassName="fixed bottom-4 left-1/2 -translate-x-1/2"
      />
    </div>
  );
}
