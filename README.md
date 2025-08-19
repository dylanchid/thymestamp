## Thymestamp

Custom date formatter for writers & journalers, built with Next.js, Tailwind (v4), and shadcn/ui.

### Run locally

```bash
npm run dev
```

Then open http://localhost:3000.

### Usage

- Edit the input to customize your format.
- Click Copy to copy the current formatted timestamp.
- Click Refresh to update the time instantly.

Available tokens (web and desktop parity):

- Basic: {day}, {day-abb}, {month}, {month-abb}, {date}, {year}, {year-short}
- Numeric: {month-num}, {month-num-pad}
- Time 12h: {time}, {hours}, {minutes}, {seconds}, {period}
- Time 24h: {time24}, {hours24}, {minutes}, {seconds}, {milliseconds}
- Calendar: {week}, {iso-week}, {quarter}, {season}
- Timezone: {timezone}, {utc-offset}, {timezone-full}
- Relative: {relative}

### Tech

- Next.js App Router + TypeScript
- Tailwind v4
- shadcn/ui components (button, card, input, label, tooltip, sonner)
 
### Desktop

- Build the desktop app: `npm run tauri:build`
- Tray icon toggles a compact timestamp widget; left-click or use a global shortcut (Cmd+Alt+T on macOS if available).
- Copies use native clipboard via plugin.
- Preferences window: open from the tray to manage presets, default format, locale/timezone, close-on-blur, always-on-top, and the global shortcut.
