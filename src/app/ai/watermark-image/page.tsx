import type { Metadata } from 'next'
import PageClient from './page-client'

export const metadata: Metadata = {
  title: 'Watermark Image Free - 100% Private Alternative to iLoveIMG',
  description: 'Add custom text or image watermarks to your photos. Docuvate operates 100% client-side. Your images never leave your computer. Free offline alternative to iLoveIMG and Pi7 Image.',
  keywords: 'watermark image online, add watermark to photo, free watermark maker, alternative to iloveimg, alternative to pi7 image, private watermark',
  alternatives: {
    canonical: 'https://itsrkmahapatra.github.io/Docuvate/ai/watermark-image/',
  },
  openGraph: {
    title: 'Watermark Image Free - 100% Private Alternative to iLoveIMG',
    description: 'Add custom text or image watermarks to your photos. Docuvate operates 100% client-side. Your images never leave your computer. Free offline alternative to iLoveIMG and Pi7 Image.',
    url: 'https://itsrkmahapatra.github.io/Docuvate/ai/watermark-image/',
    siteName: 'Docuvate',
    images: [
      {
        url: 'https://itsrkmahapatra.github.io/Docuvate/assets/developer.png',
        width: 800,
        height: 600,
        alt: 'Watermark Image Free - 100% Private Alternative to iLoveIMG',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Watermark Image Free - 100% Private Alternative to iLoveIMG',
    description: 'Add custom text or image watermarks to your photos. Docuvate operates 100% client-side. Your images never leave your computer. Free offline alternative to iLoveIMG and Pi7 Image.',
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
            "name": "Docuvate WATERMARK IMAGE",
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
            "description": "Add custom text or image watermarks to your photos. Docuvate operates 100% client-side. Your images never leave your computer. Free offline alternative to iLoveIMG and Pi7 Image."
          })
        }}
      />
      <PageClient />
    </>
  )
}