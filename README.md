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

Available tokens: {day}, {day-abb}, {month}, {month-abb}, {date}, {time}, {period}, {year}

### Tech

- Next.js App Router + TypeScript
- Tailwind v4
- shadcn/ui components (button, card, input, label, tooltip, sonner)
