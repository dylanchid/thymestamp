"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Copy, RefreshCw, Github, Home as HomeIcon, Mail, BookOpen, Save, History, ChevronDown, ChevronUp } from "lucide-react";
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

const presetTemplates = [
  {
    name: "Journal Entry",
    format: "{day}, {month} {date} {time} {period}",
    description: "Wednesday, August 18 3:45 PM"
  },
  {
    name: "Email Signature",
    format: "{day-abb} {month-abb} {date} {year}",
    description: "Wed. Aug. 18 2025"
  },
  {
    name: "Meeting Notes",
    format: "{date}/{month-abb}/{year} {time} {period}",
    description: "18/Aug/2025 3:45 PM"
  },
  {
    name: "Blog Post",
    format: "{month} {date}, {year}",
    description: "August 18, 2025"
  },
  {
    name: "Formal Date",
    format: "{day}, {month} {date}, {year} at {time} {period}",
    description: "Wednesday, August 18, 2025 at 3:45 PM"
  },
  {
    name: "Short & Sweet",
    format: "{month-abb} {date} · {time}{period}",
    description: "Aug. 18 · 3:45PM"
  }
];

const useCases = [
  { icon: "📖", title: "Journal Entries", description: "Perfect for dating your daily thoughts" },
  { icon: "✉️", title: "Email Signatures", description: "Professional timestamps for correspondence" },
  { icon: "📝", title: "Meeting Notes", description: "Clear timestamps for meeting documentation" },
  { icon: "📰", title: "Blog Posts", description: "Elegant dates for your published content" }
];

const tokenReference = [
  { token: "{day}", description: "Full day name", example: "Wednesday" },
  { token: "{day-abb}", description: "Abbreviated day", example: "Wed." },
  { token: "{month}", description: "Full month name", example: "August" },
  { token: "{month-abb}", description: "Abbreviated month", example: "Aug." },
  { token: "{date}", description: "Day of month", example: "18" },
  { token: "{time}", description: "12-hour time", example: "3:45" },
  { token: "{period}", description: "AM/PM indicator", example: "PM" },
  { token: "{year}", description: "Full year", example: "2025" }
];

export default function Home() {
  const [format, setFormat] = useState<string>("{day}, {month} {date} {time} {period}.");
  const [now, setNow] = useState<Date>(new Date());
  const [mounted, setMounted] = useState(false);
  const [savedFormats, setSavedFormats] = useState<string[]>([]);
  const [showTokenReference, setShowTokenReference] = useState(false);

  // Memoize to avoid recalculation on small state updates
  const formatted = useMemo(() => formatTimestampFrom(format, now), [format, now]);

  // Load saved formats from localStorage on mount
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('thymestamp-saved-formats');
    if (saved) {
      try {
        setSavedFormats(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved formats:', e);
      }
    }
  }, []);

  // Save formats to localStorage whenever savedFormats changes
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('thymestamp-saved-formats', JSON.stringify(savedFormats));
    }
  }, [savedFormats, mounted]);

  // Auto-refresh the time every minute and when window focuses
  useEffect(() => {
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

  const saveFormat = useCallback(() => {
    if (!savedFormats.includes(format)) {
      const newSaved = [format, ...savedFormats.slice(0, 9)]; // Keep only 10 most recent
      setSavedFormats(newSaved);
      toast.success("Format saved!");
    } else {
      toast.info("Format already saved");
    }
  }, [format, savedFormats]);

  const loadPreset = useCallback((presetFormat: string) => {
    setFormat(presetFormat);
    toast.success("Template loaded!");
  }, []);

  const loadSaved = useCallback((savedFormat: string) => {
    setFormat(savedFormat);
    toast.success("Saved format loaded!");
  }, []);

  return (
    <TooltipProvider>
      <div className="min-h-dvh flex items-center justify-center p-6 pb-28 bg-[radial-gradient(1200px_800px_at_50%_-100px,theme(colors.violet.100/.7),transparent),_linear-gradient(to_bottom,white,theme(colors.slate.50))] dark:bg-[radial-gradient(1200px_800px_at_50%_-100px,theme(colors.violet.900/.4),transparent),_linear-gradient(to_bottom,theme(colors.slate.950),theme(colors.slate.900))]">
        <div className="w-full max-w-6xl space-y-6">
          
          {/* Main Timestamp Card */}
          <Card className="border border-border/80 bg-card/95 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-card/80">
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

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" onClick={saveFormat} className="min-w-[140px]">
                      <Save className="mr-2 h-4 w-4" /> Save
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Save current format</TooltipContent>
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
                
                {/* Token Reference Toggle */}
                <div className="mt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowTokenReference(!showTokenReference)}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Token Reference {showTokenReference ? <ChevronUp className="ml-1 h-3 w-3" /> : <ChevronDown className="ml-1 h-3 w-3" />}
                  </Button>
                  
                  {showTokenReference && (
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                      {tokenReference.map((token) => (
                        <div key={token.token} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <div>
                            <code className="text-sm font-mono font-semibold">{token.token}</code>
                            <p className="text-xs text-muted-foreground">{token.description}</p>
                          </div>
                          <span className="text-sm font-mono text-muted-foreground">{token.example}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Preset Templates */}
            <Card className="border border-border/80 bg-card/95 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-card/80">
              <CardHeader>
                <CardTitle className="text-xl font-semibold">Quick Templates</CardTitle>
                <CardDescription>Click to try popular timestamp formats</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {presetTemplates.map((template) => (
                    <div
                      key={template.name}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => loadPreset(template.format)}
                    >
                      <div>
                        <p className="font-medium text-sm">{template.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{formatTimestampFrom(template.format, now)}</p>
                      </div>
                      <Button variant="ghost" size="sm" className="text-xs">Try</Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Use Cases & Saved Formats */}
            <div className="space-y-6">
              
              {/* Use Cases */}
              <Card className="border border-border/80 bg-card/95 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-card/80">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold">Perfect For</CardTitle>
                  <CardDescription>Common use cases for custom timestamps</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {useCases.map((useCase) => (
                      <div key={useCase.title} className="flex items-center space-x-3 p-3 rounded-lg bg-muted/30">
                        <span className="text-lg">{useCase.icon}</span>
                        <div>
                          <p className="font-medium text-sm">{useCase.title}</p>
                          <p className="text-xs text-muted-foreground">{useCase.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Saved Formats */}
              {savedFormats.length > 0 && (
                <Card className="border border-border/80 bg-card/95 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-card/80">
                  <CardHeader>
                    <CardTitle className="text-xl font-semibold flex items-center">
                      <History className="mr-2 h-5 w-5" />
                      Saved Formats
                    </CardTitle>
                    <CardDescription>Your recently saved timestamp formats</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {savedFormats.slice(0, 5).map((savedFormat, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => loadSaved(savedFormat)}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground font-mono truncate">{savedFormat}</p>
                            <p className="text-sm font-mono truncate">{formatTimestampFrom(savedFormat, now)}</p>
                          </div>
                          <Button variant="ghost" size="sm" className="text-xs ml-2">Load</Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>

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
