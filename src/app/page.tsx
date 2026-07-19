import type { Metadata } from 'next'
import PageClient from './page-client'

export const metadata: Metadata = {
  title: 'Docuvate - 100% Private PDF & Image Tools (iLovePDF & iLoveIMG Offline Alternative)',
  description: 'A comprehensive suite of 100% client-side, privacy-first tools to merge, compress, crop, OCR, convert, and sign PDF and Image files locally in your browser. Complete secure alternative to iLovePDF, iLoveIMG, and Pi7.',
  keywords: 'private pdf tools, local image tools, ilovepdf alternative, iloveimg alternative, pi7 pdf alternative, client side documents editor, offline pdf tools',
  alternatives: {
    canonical: 'https://itsrkmahapatra.github.io/Docuvate/',
  },
  openGraph: {
    title: 'Docuvate - 100% Private PDF & Image Tools (iLovePDF & iLoveIMG Offline Alternative)',
    description: 'A comprehensive suite of 100% client-side, privacy-first tools to merge, compress, crop, OCR, convert, and sign PDF and Image files locally in your browser. Complete secure alternative to iLovePDF, iLoveIMG, and Pi7.',
    url: 'https://itsrkmahapatra.github.io/Docuvate/',
    siteName: 'Docuvate',
    images: [
      {
        url: 'https://itsrkmahapatra.github.io/Docuvate/assets/developer.png',
        width: 800,
        height: 600,
        alt: 'Docuvate - 100% Private Document Tools',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Docuvate - 100% Private PDF & Image Tools (iLovePDF & iLoveIMG Offline Alternative)',
    description: 'A comprehensive suite of 100% client-side, privacy-first tools to merge, compress, crop, OCR, convert, and sign PDF and Image files locally in your browser. Complete secure alternative to iLovePDF, iLoveIMG, and Pi7.',
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
            "name": "Docuvate",
            "operatingSystem": "All (Windows, macOS, Linux, iOS, Android)",
            "applicationCategory": "BusinessApplication",
            "browserRequirements": "Requires HTML5 Canvas and JavaScript. Runs locally.",
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
            "description": "A comprehensive suite of 100% client-side, privacy-first tools to merge, compress, crop, OCR, convert, and sign PDF and Image files locally in your browser. Complete secure alternative to iLovePDF, iLoveIMG, and Pi7."
          })
        }}
      />
      <PageClient />
    </>
  )
}