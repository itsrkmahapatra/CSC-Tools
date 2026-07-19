import type { Metadata } from 'next'
import PageClient from './page-client'

export const metadata: Metadata = {
  title: 'Repair PDF Free - 100% Private Alternative to iLovePDF',
  description: 'Repair corrupted page streams and rebuild PDF documents locally. Docuvate operates 100% client-side. Your files never leave your computer. Free alternative to iLovePDF and Pi7 PDF.',
  keywords: 'repair pdf online, fix corrupted pdf, alternative to ilovepdf, alternative to pi7 pdf, private pdf repair tool',
  alternatives: {
    canonical: 'https://itsrkmahapatra.github.io/Docuvate/pdf/repair/',
  },
  openGraph: {
    title: 'Repair PDF Free - 100% Private Alternative to iLovePDF',
    description: 'Repair corrupted page streams and rebuild PDF documents locally. Docuvate operates 100% client-side. Your files never leave your computer. Free alternative to iLovePDF and Pi7 PDF.',
    url: 'https://itsrkmahapatra.github.io/Docuvate/pdf/repair/',
    siteName: 'Docuvate',
    images: [
      {
        url: 'https://itsrkmahapatra.github.io/Docuvate/assets/developer.png',
        width: 800,
        height: 600,
        alt: 'Repair PDF Free - 100% Private Alternative to iLovePDF',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Repair PDF Free - 100% Private Alternative to iLovePDF',
    description: 'Repair corrupted page streams and rebuild PDF documents locally. Docuvate operates 100% client-side. Your files never leave your computer. Free alternative to iLovePDF and Pi7 PDF.',
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
            "name": "Docuvate REPAIR",
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
            "description": "Repair corrupted page streams and rebuild PDF documents locally. Docuvate operates 100% client-side. Your files never leave your computer. Free alternative to iLovePDF and Pi7 PDF."
          })
        }}
      />
      <PageClient />
    </>
  )
}