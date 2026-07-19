import type { Metadata } from 'next'
import PageClient from './page-client'

export const metadata: Metadata = {
  title: 'Split PDF Free - 100% Private Alternative to iLovePDF & Pi7',
  description: 'Split pages, specific ranges, or extract all pages of a PDF into individual files. Docuvate operates 100% client-side. Your files never touch any server. Free alternative to iLovePDF and Pi7 PDF.',
  keywords: 'split pdf online, separate pdf pages, alternative to ilovepdf, alternative to pi7 pdf, private pdf splitter',
  alternatives: {
    canonical: 'https://itsrkmahapatra.github.io/Docuvate/pdf/split/',
  },
  openGraph: {
    title: 'Split PDF Free - 100% Private Alternative to iLovePDF & Pi7',
    description: 'Split pages, specific ranges, or extract all pages of a PDF into individual files. Docuvate operates 100% client-side. Your files never touch any server. Free alternative to iLovePDF and Pi7 PDF.',
    url: 'https://itsrkmahapatra.github.io/Docuvate/pdf/split/',
    siteName: 'Docuvate',
    images: [
      {
        url: 'https://itsrkmahapatra.github.io/Docuvate/assets/developer.png',
        width: 800,
        height: 600,
        alt: 'Split PDF Free - 100% Private Alternative to iLovePDF & Pi7',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Split PDF Free - 100% Private Alternative to iLovePDF & Pi7',
    description: 'Split pages, specific ranges, or extract all pages of a PDF into individual files. Docuvate operates 100% client-side. Your files never touch any server. Free alternative to iLovePDF and Pi7 PDF.',
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
            "name": "Docuvate SPLIT",
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
            "description": "Split pages, specific ranges, or extract all pages of a PDF into individual files. Docuvate operates 100% client-side. Your files never touch any server. Free alternative to iLovePDF and Pi7 PDF."
          })
        }}
      />
      <PageClient />
    </>
  )
}