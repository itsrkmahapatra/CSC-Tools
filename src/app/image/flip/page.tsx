import type { Metadata } from 'next'
import PageClient from './page-client'

export const metadata: Metadata = {
  title: 'Flip Image Free - 100% Private Alternative to iLoveIMG',
  description: 'Flip images horizontally or vertically. Docuvate operates 100% client-side. Your images never leave your computer. Free offline alternative to iLoveIMG and Pi7 Image.',
  keywords: 'flip image online, mirror image photo, free photo flipper, alternative to iloveimg, private image flipper',
  alternatives: {
    canonical: 'https://itsrkmahapatra.github.io/Docuvate/image/flip/',
  },
  openGraph: {
    title: 'Flip Image Free - 100% Private Alternative to iLoveIMG',
    description: 'Flip images horizontally or vertically. Docuvate operates 100% client-side. Your images never leave your computer. Free offline alternative to iLoveIMG and Pi7 Image.',
    url: 'https://itsrkmahapatra.github.io/Docuvate/image/flip/',
    siteName: 'Docuvate',
    images: [
      {
        url: 'https://itsrkmahapatra.github.io/Docuvate/assets/developer.png',
        width: 800,
        height: 600,
        alt: 'Flip Image Free - 100% Private Alternative to iLoveIMG',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Flip Image Free - 100% Private Alternative to iLoveIMG',
    description: 'Flip images horizontally or vertically. Docuvate operates 100% client-side. Your images never leave your computer. Free offline alternative to iLoveIMG and Pi7 Image.',
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
            "name": "Docuvate FLIP",
            "operatingSystem": "All (Windows, macOS, Linux, iOS, Android)",
            "applicationCategory": "ImageEditor",
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
            "description": "Flip images horizontally or vertically. Docuvate operates 100% client-side. Your images never leave your computer. Free offline alternative to iLoveIMG and Pi7 Image."
          })
        }}
      />
      <PageClient />
    </>
  )
}