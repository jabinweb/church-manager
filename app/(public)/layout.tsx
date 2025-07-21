import type { Metadata } from 'next'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { getChurchSettings } from '@/lib/settings'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getChurchSettings();
  
  return {
    title: {
      default: settings.churchName || 'Grace Community Church',
      template: `%s | ${settings.churchName || 'Grace Community Church'}`
    },
    description: 'Serving our community through faith, fellowship, and service',
    keywords: ['church', 'worship', 'community', 'faith', 'sermons', 'ministry'],
    icons: {
      icon: '/favicon.ico',
    },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: settings.churchWebsite || 'https://gracechurch.org',
      title: settings.churchName || 'Grace Community Church',
      description: 'Serving our community through faith, fellowship, and service',
      siteName: settings.churchName || 'Grace Community Church',
    },
    twitter: {
      card: 'summary_large_image',
      title: settings.churchName || 'Grace Community Church',
      description: 'Serving our community through faith, fellowship, and service',
    }
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {

  return (
    <div className="min-h-screen flex flex-col">
      <div className="sticky top-0 z-50">
        <Header />
      </div>
      <div className="flex-1">
        {children}
      </div>
      <Footer />
    </div>
  )
}