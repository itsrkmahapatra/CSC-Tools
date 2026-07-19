import type { Metadata } from 'next'
import PageClient from './page-client'

export const metadata: Metadata = {
  title: 'Compare PDF side-by-side Free - 100% Private Alternative to Copyleaks',
  description: 'Compare two PDF documents side-by-side to highlight page, text, or layout changes. Docuvate operates 100% client-side. Your files never touch any server. Free alternative to Copyleaks.',
  keywords: 'compare pdf side by side, pdf comparison tool, alternative to copyleaks, alternative to ilovepdf, private pdf comparator',
  alternatives: {
    canonical: 'https://itsrkmahapatra.github.io/Docuvate/pdf/compare/',
  },
  openGraph: {
    title: 'Compare PDF side-by-side Free - 100% Private Alternative to Copyleaks',
    description: 'Compare two PDF documents side-by-side to highlight page, text, or layout changes. Docuvate operates 100% client-side. Your files never touch any server. Free alternative to Copyleaks.',
    url: 'https://itsrkmahapatra.github.io/Docuvate/pdf/compare/',
    siteName: 'Docuvate',
    images: [
      {
        url: 'https://itsrkmahapatra.github.io/Docuvate/assets/developer.png',
        width: 800,
        height: 600,
        alt: 'Compare PDF side-by-side Free - 100% Private Alternative to Copyleaks',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Compare PDF side-by-side Free - 100% Private Alternative to Copyleaks',
    description: 'Compare two PDF documents side-by-side to highlight page, text, or layout changes. Docuvate operates 100% client-side. Your files never touch any server. Free alternative to Copyleaks.',
    creator: '@itsrkmahapatra',
    images: ['https://itsrkmahapatra.github.io/Docuvate/assets/developer.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Docuvate COMPARE",
            "operatingSystem": "All (Windows, macOS, Linux, iOS, Android)",
            "applicationCategory": "BusinessApplication",
            "browserRequirements": "Requires JavaScript and modern browser context. Runs 100% client-side offline.",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "author": {
              "@type": "Person",
              "name": "Raj Kishor Mahapatra",
              "url": "https://itsrkmahapatra.qzz.io/"
            },
            "description": "Compare two PDF documents side-by-side to highlight page, text, or layout changes. Docuvate operates 100% client-side. Your files never touch any server. Free alternative to Copyleaks."
          })
        }}
      />
      <PageClient />
    </>
  )
}