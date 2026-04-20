# Internationalization (Track 11.11)

Baseline wiring:

- `next-intl` plugin in `next.config.ts` → `src/i18n/request.ts`
- Messages: `messages/en.json`
- `src/app/landing/layout.tsx` wraps the marketing surface with `NextIntlClientProvider`

Extend with `[locale]` routing when you add a second language.
