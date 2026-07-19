import type { Metadata } from 'next'
import PageClient from './page-client'

export const metadata: Metadata = {
  title: 'Resize Image Free - 100% Private Alternative to iLoveIMG & Pi7',
  description: 'Resize images by percentage or custom width and height. Docuvate operates 100% client-side. Your files never leave your computer. Free alternative to iLoveIMG and Pi7 Image.',
  keywords: 'resize image online, image resizer free, alternative to iloveimg, alternative to pi7 image, private image resizer, offline resize',
  alternatives: {
    canonical: 'https://itsrkmahapatra.github.io/Docuvate/image/resize/',
  },
  openGraph: {
    title: 'Resize Image Free - 100% Private Alternative to iLoveIMG & Pi7',
    description: 'Resize images by percentage or custom width and height. Docuvate operates 100% client-side. Your files never leave your computer. Free alternative to iLoveIMG and Pi7 Image.',
    url: 'https://itsrkmahapatra.github.io/Docuvate/image/resize/',
    siteName: 'Docuvate',
    images: [
      {
        url: 'https://itsrkmahapatra.github.io/Docuvate/assets/developer.png',
        width: 800,
        height: 600,
        alt: 'Resize Image Free - 100% Private Alternative to iLoveIMG & Pi7',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Resize Image Free - 100% Private Alternative to iLoveIMG & Pi7',
    description: 'Resize images by percentage or custom width and height. Docuvate operates 100% client-side. Your files never leave your computer. Free alternative to iLoveIMG and Pi7 Image.',
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
            "name": "Docuvate RESIZE",
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
            "description": "Resize images by percentage or custom width and height. Docuvate operates 100% client-side. Your files never leave your computer. Free alternative to iLoveIMG and Pi7 Image."
          })
        }}
      />
      <PageClient />
    </>
  )
}