import type { Metadata } from 'next'
import PageClient from './page-client'

export const metadata: Metadata = {
  title: 'Blur Image Regions Free - 100% Private Alternative to iLoveIMG',
  description: 'Add regional blur or blocky pixelation to faces, license plates, and sensitive details in your photos. Docuvate works 100% client-side; your files never touch any server. Free alternative to iLoveIMG and Pi7.',
  keywords: 'blur image online, pixelate image, regional blur, face blur photo, alternative to iloveimg, alternative to pi7, offline image blur',
  alternatives: {
    canonical: 'https://itsrkmahapatra.github.io/Docuvate/ai/blur/',
  },
  openGraph: {
    title: 'Blur Image Regions Free - 100% Private Alternative to iLoveIMG',
    description: 'Add regional blur or blocky pixelation to faces, license plates, and sensitive details in your photos. Docuvate works 100% client-side; your files never touch any server. Free alternative to iLoveIMG and Pi7.',
    url: 'https://itsrkmahapatra.github.io/Docuvate/ai/blur/',
    siteName: 'Docuvate',
    images: [
      {
        url: 'https://itsrkmahapatra.github.io/Docuvate/assets/developer.png',
        width: 800,
        height: 600,
        alt: 'Blur Image Regions Free - 100% Private Alternative to iLoveIMG',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blur Image Regions Free - 100% Private Alternative to iLoveIMG',
    description: 'Add regional blur or blocky pixelation to faces, license plates, and sensitive details in your photos. Docuvate works 100% client-side; your files never touch any server. Free alternative to iLoveIMG and Pi7.',
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
            "name": "Docuvate BLUR",
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
            "description": "Add regional blur or blocky pixelation to faces, license plates, and sensitive details in your photos. Docuvate works 100% client-side; your files never touch any server. Free alternative to iLoveIMG and Pi7."
          })
        }}
      />
      <PageClient />
    </>
  )
}