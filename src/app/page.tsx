"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Copy, RefreshCw, Github, Home as HomeIcon, Mail, BookOpen } from "lucide-react";
import { FloatingDock } from "@/components/ui/floating-dock";
import { toast } from "sonner";

function formatTimestampFrom(format: string, now: Date) {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const daysAbb = ["Sun.", "Mon.", "Tue.", "Wed.", "Thu.", "Fri.", "Sat."];
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const monthsAbb = ["Jan.", "Feb.", "Mar.", "Apr.", "May", "Jun.", "Jul.", "Aug.", "Sep.", "Oct.", "Nov.", "Dec."];

  const dayName = days[now.getDay()];
  const dayAbb = daysAbb[now.getDay()];
  const monthName = months[now.getMonth()];
  const monthAbb = monthsAbb[now.getMonth()];
  const date = now.getDate();
  const year = now.getFullYear();

  let hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  if (hours > 12) hours -= 12;
  else if (hours === 0) hours = 12;
  const time = `${hours}:${minutes}`;

  return format
    .replace(/{day-abb}/g, dayAbb)
    .replace(/{month-abb}/g, monthAbb)
    .replace(/{day}/g, dayName)
    .replace(/{month}/g, monthName)
    .replace(/{date}/g, String(date))
    .replace(/{time}/g, time)
    .replace(/{period}/g, ampm)
    .replace(/{year}/g, String(year));
}

export default function Home() {
  const [format, setFormat] = useState<string>("{day}, {month} {date} {time} {period}.");
  const [now, setNow] = useState<Date>(new Date());
  const [mounted, setMounted] = useState(false);

  // Memoize to avoid recalculation on small state updates
  const formatted = useMemo(() => formatTimestampFrom(format, now), [format, now]);

  // Auto-refresh the time every minute and when window focuses
  useEffect(() => {
  setMounted(true);
    const id = setInterval(() => setNow(new Date()), 60_000);
    const onFocus = () => setNow(new Date());
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const refresh = useCallback(() => setNow(new Date()), []);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(formatted);
      toast.success("Copied to clipboard");
    } catch {
      // Fallback
      const ta = document.createElement("textarea");
      ta.value = formatted;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      toast.success("Copied to clipboard");
    }
  }, [formatted]);

  return (
    <TooltipProvider>
  <div className="min-h-dvh flex items-center justify-center p-6 pb-28 bg-[radial-gradient(1200px_800px_at_50%_-100px,theme(colors.violet.100/.7),transparent),_linear-gradient(to_bottom,white,theme(colors.slate.50))] dark:bg-[radial-gradient(1200px_800px_at_50%_-100px,theme(colors.violet.900/.4),transparent),_linear-gradient(to_bottom,theme(colors.slate.950),theme(colors.slate.900))]">
        <Card className="w-full max-w-2xl border border-border/80 bg-card/95 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-card/80">
          <CardHeader>
            <CardTitle className="text-3xl md:text-4xl font-semibold tracking-tight">
              Thymestamp
            </CardTitle>
            <CardDescription>Custom date formatter for writers & journalers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border bg-muted p-5 font-mono text-base text-foreground/90 min-h-10">
              {mounted ? formatted : "\u00A0"}
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={copy} className="min-w-[160px]">
                    <Copy className="mr-2 h-4 w-4" /> Copy
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Copy to clipboard</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="secondary" onClick={refresh} className="min-w-[140px]">
                    <RefreshCw className="mr-2 h-4 w-4" /> Refresh
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh timestamp</TooltipContent>
              </Tooltip>
            </div>

            <div className="mt-6 rounded-lg border p-5">
              <Label htmlFor="format" className="font-semibold">
                Custom Format
              </Label>
              <Input
                id="format"
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="mt-2 font-mono"
                placeholder="{day}, {month} {date} {time} {period}."
              />
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                <span className="font-semibold">Available tokens:</span> {"{day}"}, {"{day-abb}"}, {"{month}"}, {"{month-abb}"}, {"{date}"}, {"{time}"}, {"{period}"}, {"{year}"}
              </p>
            </div>
          </CardContent>
        </Card>
        {/* Floating Dock */}
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
    </TooltipProvider>
  );
}
