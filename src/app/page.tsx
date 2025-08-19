"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Copy, RefreshCw, Github, Home as HomeIcon, Mail, BookOpen, Save, History, ChevronDown, ChevronUp, Globe, Clock } from "lucide-react";
import { FloatingDock } from "@/components/ui/floating-dock";
import { toast } from "sonner";
import { getWeek, getISOWeek, getQuarter } from "date-fns";
import { enUS, fr, es, de, ja, zhCN, ar } from "date-fns/locale";
import { formatInTimeZone, toZonedTime } from "date-fns-tz";

// Locale configurations
const locales = {
  'en-US': { locale: enUS, name: 'English (US)' },
  'en-GB': { locale: enUS, name: 'English (UK)' },
  'fr-FR': { locale: fr, name: 'Français' },
  'es-ES': { locale: es, name: 'Español' },
  'de-DE': { locale: de, name: 'Deutsch' },
  'ja-JP': { locale: ja, name: '日本語' },
  'zh-CN': { locale: zhCN, name: '中文' },
  'ar-SA': { locale: ar, name: 'العربية' },
};

// Common timezones
const timezones = [
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'Eastern Time' },
  { value: 'America/Chicago', label: 'Central Time' },
  { value: 'America/Denver', label: 'Mountain Time' },
  { value: 'America/Los_Angeles', label: 'Pacific Time' },
  { value: 'Europe/London', label: 'London' },
  { value: 'Europe/Paris', label: 'Paris' },
  { value: 'Europe/Berlin', label: 'Berlin' },
  { value: 'Asia/Tokyo', label: 'Tokyo' },
  { value: 'Asia/Shanghai', label: 'Shanghai' },
  { value: 'Australia/Sydney', label: 'Sydney' },
];

// Helper functions for advanced formatting
function getOrdinalSuffix(day: number): string {
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

function getSeason(month: number): string {
  if (month >= 2 && month <= 4) return 'Spring';
  if (month >= 5 && month <= 7) return 'Summer';
  if (month >= 8 && month <= 10) return 'Fall';
  return 'Winter';
}

function getRelativeTime(date: Date, now: Date): string {
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffMinutes > 0) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
  return 'just now';
}

function formatTimestampFrom(format: string, date: Date, _locale = 'en-US', timezone = 'UTC'): string {
  try {
  // mark unused param as intentionally unused
  void _locale;
    // Convert date to specified timezone
    const zonedDate = timezone === 'UTC' ? date : toZonedTime(date, timezone);
  // const localeConfig = locales[locale as keyof typeof locales] || locales['en-US'];
    
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const daysAbb = ["Sun.", "Mon.", "Tue.", "Wed.", "Thu.", "Fri.", "Sat."];
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const monthsAbb = ["Jan.", "Feb.", "Mar.", "Apr.", "May", "Jun.", "Jul.", "Aug.", "Sep.", "Oct.", "Nov.", "Dec."];

    const dayName = days[zonedDate.getDay()];
    const dayAbb = daysAbb[zonedDate.getDay()];
    const monthName = months[zonedDate.getMonth()];
    const monthAbb = monthsAbb[zonedDate.getMonth()];
    const dateNum = zonedDate.getDate();
    const year = zonedDate.getFullYear();
    const month = zonedDate.getMonth() + 1;

    // Time calculations
    let hours12 = zonedDate.getHours();
    const hours24 = zonedDate.getHours();
    const minutes = zonedDate.getMinutes().toString().padStart(2, "0");
    const seconds = zonedDate.getSeconds().toString().padStart(2, "0");
    const milliseconds = zonedDate.getMilliseconds().toString().padStart(3, "0");
    const ampm = hours12 >= 12 ? "PM" : "AM";
    
    if (hours12 > 12) hours12 -= 12;
    else if (hours12 === 0) hours12 = 12;
    
    const time12 = `${hours12}:${minutes}`;
    const time24 = `${hours24.toString().padStart(2, "0")}:${minutes}`;

    // Advanced calculations
    const quarter = getQuarter(zonedDate);
    const season = getSeason(zonedDate.getMonth());
    const weekNum = getWeek(zonedDate);
    const isoWeekNum = getISOWeek(zonedDate);
    const dayOrdinal = `${dateNum}${getOrdinalSuffix(dateNum)}`;
    
    // Timezone info
    const timezoneAbb = timezone === 'UTC' ? 'UTC' : new Intl.DateTimeFormat('en', { 
      timeZone: timezone, 
      timeZoneName: 'short' 
    }).formatToParts(zonedDate).find(part => part.type === 'timeZoneName')?.value || '';
    
    const utcOffset = timezone === 'UTC' ? '+00:00' : 
      formatInTimeZone(zonedDate, timezone, 'xxx');

    // Relative time
    const relativeTime = getRelativeTime(date, new Date());

    return format
      // Basic tokens
      .replace(/{day-abb}/g, dayAbb)
      .replace(/{month-abb}/g, monthAbb)
      .replace(/{day}/g, dayName)
      .replace(/{month}/g, monthName)
      .replace(/{date}/g, String(dateNum))
      .replace(/{time}/g, time12)
      .replace(/{period}/g, ampm)
      .replace(/{year}/g, String(year))
      
      // Enhanced time tokens
      .replace(/{time24}/g, time24)
      .replace(/{seconds}/g, seconds)
      .replace(/{milliseconds}/g, milliseconds)
      .replace(/{hours}/g, String(hours12))
      .replace(/{hours24}/g, String(hours24))
      .replace(/{minutes}/g, minutes)
      
      // Date tokens
      .replace(/{day-ordinal}/g, dayOrdinal)
      .replace(/{month-num}/g, String(month))
      .replace(/{month-num-pad}/g, month.toString().padStart(2, "0"))
      .replace(/{year-short}/g, String(year).slice(-2))
      
      // Week and calendar tokens
      .replace(/{week}/g, String(weekNum))
      .replace(/{iso-week}/g, String(isoWeekNum))
      .replace(/{quarter}/g, String(quarter))
      .replace(/{season}/g, season)
      
      // Timezone tokens
      .replace(/{timezone}/g, timezoneAbb)
      .replace(/{utc-offset}/g, utcOffset)
      .replace(/{timezone-full}/g, timezone)
      
      // Relative time
      .replace(/{relative}/g, relativeTime);
      
  } catch (error) {
    console.error('Formatting error:', error);
    return 'Invalid format';
  }
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
  },
  {
    name: "24-Hour Format",
    format: "{day-abb} {month-abb} {date} {time24}",
    description: "Wed. Aug. 18 15:45"
  },
  {
    name: "ISO Style",
    format: "{year}-{month-num-pad}-{date} {time24}",
    description: "2025-08-18 15:45"
  }
];

const useCases = [
  { icon: "📖", title: "Journal Entries", description: "Perfect for dating your daily thoughts" },
  { icon: "✉️", title: "Email Signatures", description: "Professional timestamps for correspondence" },
  { icon: "📝", title: "Meeting Notes", description: "Clear timestamps for meeting documentation" },
  { icon: "📰", title: "Blog Posts", description: "Elegant dates for your published content" }
];

// Organized token reference by categories
const tokenCategories = [
  {
    category: "Basic Date",
    icon: "📅",
    tokens: [
      { token: "{day}", description: "Full day name", example: "Wednesday" },
      { token: "{day-abb}", description: "Abbreviated day", example: "Wed." },
      { token: "{month}", description: "Full month name", example: "August" },
      { token: "{month-abb}", description: "Abbreviated month", example: "Aug." },
      { token: "{date}", description: "Day of month", example: "18" },
      { token: "{day-ordinal}", description: "Day with ordinal suffix", example: "18th" },
      { token: "{year}", description: "Full year", example: "2025" },
      { token: "{year-short}", description: "Two-digit year", example: "25" }
    ]
  },
  {
    category: "Numeric Date",
    icon: "🔢",
    tokens: [
      { token: "{month-num}", description: "Month number", example: "8" },
      { token: "{month-num-pad}", description: "Month number (padded)", example: "08" },
      { token: "{date}", description: "Day of month", example: "18" },
      { token: "{year}", description: "Full year", example: "2025" },
      { token: "{year-short}", description: "Two-digit year", example: "25" }
    ]
  },
  {
    category: "Time (12-hour)",
    icon: "🕐",
    tokens: [
      { token: "{time}", description: "12-hour time", example: "3:45" },
      { token: "{hours}", description: "Hours (12-hour)", example: "3" },
      { token: "{minutes}", description: "Minutes", example: "45" },
      { token: "{seconds}", description: "Seconds", example: "30" },
      { token: "{period}", description: "AM/PM indicator", example: "PM" }
    ]
  },
  {
    category: "Time (24-hour)",
    icon: "🕒",
    tokens: [
      { token: "{time24}", description: "24-hour time", example: "15:45" },
      { token: "{hours24}", description: "Hours (24-hour)", example: "15" },
      { token: "{minutes}", description: "Minutes", example: "45" },
      { token: "{seconds}", description: "Seconds", example: "30" },
      { token: "{milliseconds}", description: "Milliseconds", example: "123" }
    ]
  },
  {
    category: "Calendar",
    icon: "🗓️",
    tokens: [
      { token: "{week}", description: "Week number", example: "33" },
      { token: "{iso-week}", description: "ISO week number", example: "33" },
      { token: "{quarter}", description: "Quarter of year", example: "3" },
      { token: "{season}", description: "Season", example: "Summer" }
    ]
  },
  {
    category: "Timezone",
    icon: "🌍",
    tokens: [
      { token: "{timezone}", description: "Timezone abbreviation", example: "PST" },
      { token: "{utc-offset}", description: "UTC offset", example: "-08:00" },
      { token: "{timezone-full}", description: "Full timezone name", example: "America/Los_Angeles" }
    ]
  },
  {
    category: "Relative",
    icon: "⏱️",
    tokens: [
      { token: "{relative}", description: "Relative time", example: "2 hours ago" }
    ]
  }
];

export default function Home() {
  const [format, setFormat] = useState<string>("{day}, {month} {date} {time} {period}.");
  const [now, setNow] = useState<Date>(new Date());
  const [mounted, setMounted] = useState(false);
  const [savedFormats, setSavedFormats] = useState<string[]>([]);
  const [showTokenReference, setShowTokenReference] = useState(false);
  const [selectedLocale, setSelectedLocale] = useState<string>('en-US');
  const [selectedTimezone, setSelectedTimezone] = useState<string>('UTC');
  const [showMultipleTimezones, setShowMultipleTimezones] = useState(false);

  // Check if running in Tauri
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isDesktop = window.__TAURI__ !== undefined;
      
      // If in Tauri, redirect to tray interface
      if (isDesktop && window.location.pathname === '/') {
        window.location.href = '/tray/';
      }
    }
  }, []);

  // Memoize to avoid recalculation on small state updates
  const formatted = useMemo(() => formatTimestampFrom(format, now, selectedLocale, selectedTimezone), [format, now, selectedLocale, selectedTimezone]);

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
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-3xl md:text-4xl font-semibold tracking-tight">
                    Thymestamp
                  </CardTitle>
                  <CardDescription>Custom date formatter for writers & journalers</CardDescription>
                </div>
                <div className="flex flex-col items-end gap-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Globe className="h-3 w-3" />
                    {locales[selectedLocale as keyof typeof locales]?.name}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {timezones.find(tz => tz.value === selectedTimezone)?.label}
                  </div>
                </div>
              </div>
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
                
                {/* Locale and Timezone Controls */}
                <div className="mt-2 flex flex-wrap gap-3">
                  <div className="flex-1 min-w-[200px]">
                    <Label className="text-sm text-muted-foreground mb-1 block">Locale</Label>
                    <select 
                      value={selectedLocale} 
                      onChange={(e) => setSelectedLocale(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      {Object.entries(locales).map(([key, locale]) => (
                        <option key={key} value={key}>{locale.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex-1 min-w-[200px]">
                    <Label className="text-sm text-muted-foreground mb-1 block">Timezone</Label>
                    <select 
                      value={selectedTimezone} 
                      onChange={(e) => setSelectedTimezone(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      {timezones.map((tz) => (
                        <option key={tz.value} value={tz.value}>{tz.label} ({tz.value})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <Input
                  id="format"
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  className="mt-3 font-mono"
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
                    <div className="mt-3 space-y-4">
                      {tokenCategories.map((category) => (
                        <div key={category.category} className="border rounded-lg p-4 bg-muted/30">
                          <h4 className="font-semibold text-sm mb-3 flex items-center">
                            <span className="mr-2">{category.icon}</span>
                            {category.category}
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {category.tokens.map((token) => (
                              <div 
                                key={token.token} 
                                className="flex items-center justify-between p-2 rounded bg-background/50 hover:bg-background cursor-pointer transition-colors"
                                onClick={() => {
                                  const newFormat = format + token.token;
                                  setFormat(newFormat);
                                  toast.success(`Added ${token.token}`);
                                }}
                              >
                                <div>
                                  <code className="text-xs font-mono font-semibold text-primary">{token.token}</code>
                                  <p className="text-xs text-muted-foreground">{token.description}</p>
                                </div>
                                <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
                                  {token.example}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Multiple Timezone Display */}
          <Card className="border border-border/80 bg-card/95 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-card/80">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-semibold">Multiple Timezones</CardTitle>
                  <CardDescription>See your format across different timezones</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMultipleTimezones(!showMultipleTimezones)}
                >
                  {showMultipleTimezones ? 'Hide' : 'Show'} Timezones
                </Button>
              </div>
            </CardHeader>
            {showMultipleTimezones && (
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {['UTC', 'America/New_York', 'America/Los_Angeles', 'Europe/London', 'Asia/Tokyo', 'Australia/Sydney'].map((tz) => (
                    <div key={tz} className="p-3 rounded-lg border bg-muted/30">
                      <div className="text-sm font-medium text-muted-foreground mb-1">
                        {timezones.find(timezone => timezone.value === tz)?.label || tz}
                      </div>
                      <div className="font-mono text-sm">
                        {formatTimestampFrom(format, now, selectedLocale, tz)}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {tz}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
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
                        <p className="text-xs text-muted-foreground font-mono">{formatTimestampFrom(template.format, now, selectedLocale, selectedTimezone)}</p>
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
                            <p className="text-sm font-mono truncate">{formatTimestampFrom(savedFormat, now, selectedLocale, selectedTimezone)}</p>
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
