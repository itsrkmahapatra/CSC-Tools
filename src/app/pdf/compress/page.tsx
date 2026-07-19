import type { Metadata } from 'next'
import PageClient from './page-client'

export const metadata: Metadata = {
  title: 'Compress PDF Free - 100% Private Alternative to iLovePDF & Pi7',
  description: 'Compress and reduce PDF size with balance, quality, and custom target KB size presets. Docuvate operates 100% client-side. Your files never leave your computer. Free alternative to iLovePDF and Pi7 PDF.',
  keywords: 'compress pdf online, reduce pdf size, pdf compressor free, alternative to ilovepdf, alternative to pi7 pdf, private pdf compressor',
  alternatives: {
    canonical: 'https://itsrkmahapatra.github.io/Docuvate/pdf/compress/',
  },
  openGraph: {
    title: 'Compress PDF Free - 100% Private Alternative to iLovePDF & Pi7',
    description: 'Compress and reduce PDF size with balance, quality, and custom target KB size presets. Docuvate operates 100% client-side. Your files never leave your computer. Free alternative to iLovePDF and Pi7 PDF.',
    url: 'https://itsrkmahapatra.github.io/Docuvate/pdf/compress/',
    siteName: 'Docuvate',
    images: [
      {
        url: 'https://itsrkmahapatra.github.io/Docuvate/assets/developer.png',
        width: 800,
        height: 600,
        alt: 'Compress PDF Free - 100% Private Alternative to iLovePDF & Pi7',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Compress PDF Free - 100% Private Alternative to iLovePDF & Pi7',
    description: 'Compress and reduce PDF size with balance, quality, and custom target KB size presets. Docuvate operates 100% client-side. Your files never leave your computer. Free alternative to iLovePDF and Pi7 PDF.',
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
            "name": "Docuvate COMPRESS",
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
            "description": "Compress and reduce PDF size with balance, quality, and custom target KB size presets. Docuvate operates 100% client-side. Your files never leave your computer. Free alternative to iLovePDF and Pi7 PDF."
          })
        }}
      />
      <PageClient />
    </>
  )
}