import type { Metadata } from 'next'
import PageClient from './page-client'

export const metadata: Metadata = {
  title: 'Compress Image Free - 100% Private Alternative to iLoveIMG & Pi7',
  description: 'Compress images with custom quality and size presets locally. Docuvate operates 100% client-side. Your files never leave your computer. Free alternative to iLoveIMG and Pi7 Image.',
  keywords: 'compress image online, image compressor, alternative to iloveimg, alternative to pi7 image, private image compressor, offline compress',
  alternatives: {
    canonical: 'https://itsrkmahapatra.github.io/Docuvate/image/compress/',
  },
  openGraph: {
    title: 'Compress Image Free - 100% Private Alternative to iLoveIMG & Pi7',
    description: 'Compress images with custom quality and size presets locally. Docuvate operates 100% client-side. Your files never leave your computer. Free alternative to iLoveIMG and Pi7 Image.',
    url: 'https://itsrkmahapatra.github.io/Docuvate/image/compress/',
    siteName: 'Docuvate',
    images: [
      {
        url: 'https://itsrkmahapatra.github.io/Docuvate/assets/developer.png',
        width: 800,
        height: 600,
        alt: 'Compress Image Free - 100% Private Alternative to iLoveIMG & Pi7',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Compress Image Free - 100% Private Alternative to iLoveIMG & Pi7',
    description: 'Compress images with custom quality and size presets locally. Docuvate operates 100% client-side. Your files never leave your computer. Free alternative to iLoveIMG and Pi7 Image.',
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
            "description": "Compress images with custom quality and size presets locally. Docuvate operates 100% client-side. Your files never leave your computer. Free alternative to iLoveIMG and Pi7 Image."
          })
        }}
      />
      <PageClient />
    </>
  )
}