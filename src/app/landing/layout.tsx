import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'

export default async function LandingLayout({ children }: { children: React.ReactNode }) {
  setRequestLocale('en')
  const messages = await getMessages()
  return (
    <NextIntlClientProvider locale="en" messages={messages}>
      {children}
    </NextIntlClientProvider>
  )
}
