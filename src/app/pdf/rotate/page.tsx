import type { Metadata } from 'next'
import PageClient from './page-client'

export const metadata: Metadata = {
  title: 'Rotate PDF Free - 100% Private Alternative to iLovePDF & Pi7',
  description: 'Change rotation of PDF pages (90, 180, 270 degrees) locally. Docuvate operates 100% client-side. Your files never touch any server. Free alternative to iLovePDF and Pi7 PDF.',
  keywords: 'rotate pdf pages, turn pdf pages, alternative to ilovepdf, alternative to pi7 pdf, private pdf rotater',
  alternatives: {
    canonical: 'https://itsrkmahapatra.github.io/Docuvate/pdf/rotate/',
  },
  openGraph: {
    title: 'Rotate PDF Free - 100% Private Alternative to iLovePDF & Pi7',
    description: 'Change rotation of PDF pages (90, 180, 270 degrees) locally. Docuvate operates 100% client-side. Your files never touch any server. Free alternative to iLovePDF and Pi7 PDF.',
    url: 'https://itsrkmahapatra.github.io/Docuvate/pdf/rotate/',
    siteName: 'Docuvate',
    images: [
      {
        url: 'https://itsrkmahapatra.github.io/Docuvate/assets/developer.png',
        width: 800,
        height: 600,
        alt: 'Rotate PDF Free - 100% Private Alternative to iLovePDF & Pi7',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Rotate PDF Free - 100% Private Alternative to iLovePDF & Pi7',
    description: 'Change rotation of PDF pages (90, 180, 270 degrees) locally. Docuvate operates 100% client-side. Your files never touch any server. Free alternative to iLovePDF and Pi7 PDF.',
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
            "name": "Docuvate ROTATE",
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
            "description": "Change rotation of PDF pages (90, 180, 270 degrees) locally. Docuvate operates 100% client-side. Your files never touch any server. Free alternative to iLovePDF and Pi7 PDF."
          })
        }}
      />
      <PageClient />
    </>
  )
}