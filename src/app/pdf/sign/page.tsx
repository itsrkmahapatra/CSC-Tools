import type { Metadata } from 'next'
import PageClient from './page-client'

export const metadata: Metadata = {
  title: 'Sign PDF Free - 100% Private Alternative to iLovePDF & eSign',
  description: 'Place custom pen drawing, typed name in cursive font, or signature image overlays on PDF pages. Docuvate operates 100% client-side. Your files never touch any server. Free alternative to iLovePDF.',
  keywords: 'sign pdf online, draw signature on pdf, sign document free, alternative to ilovepdf, private pdf signer',
  alternatives: {
    canonical: 'https://itsrkmahapatra.github.io/Docuvate/pdf/sign/',
  },
  openGraph: {
    title: 'Sign PDF Free - 100% Private Alternative to iLovePDF & eSign',
    description: 'Place custom pen drawing, typed name in cursive font, or signature image overlays on PDF pages. Docuvate operates 100% client-side. Your files never touch any server. Free alternative to iLovePDF.',
    url: 'https://itsrkmahapatra.github.io/Docuvate/pdf/sign/',
    siteName: 'Docuvate',
    images: [
      {
        url: 'https://itsrkmahapatra.github.io/Docuvate/assets/developer.png',
        width: 800,
        height: 600,
        alt: 'Sign PDF Free - 100% Private Alternative to iLovePDF & eSign',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sign PDF Free - 100% Private Alternative to iLovePDF & eSign',
    description: 'Place custom pen drawing, typed name in cursive font, or signature image overlays on PDF pages. Docuvate operates 100% client-side. Your files never touch any server. Free alternative to iLovePDF.',
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
            "name": "Docuvate SIGN",
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
            "description": "Place custom pen drawing, typed name in cursive font, or signature image overlays on PDF pages. Docuvate operates 100% client-side. Your files never touch any server. Free alternative to iLovePDF."
          })
        }}
      />
      <PageClient />
    </>
  )
}