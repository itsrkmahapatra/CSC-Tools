import type { Metadata } from 'next'
import PageClient from './page-client'

export const metadata: Metadata = {
  title: 'Remove Background Free - 100% Private Offline Alternative to iLoveIMG',
  description: 'Isolate subjects and remove backgrounds locally using browser-native AI. Docuvate operates 100% client-side. Your files never touch any server. Free alternative to iLoveIMG and remove.bg.',
  keywords: 'remove background offline, remove bg online, bg remover free, alternative to iloveimg, alternative to remove.bg, private bg remover',
  alternatives: {
    canonical: 'https://itsrkmahapatra.github.io/Docuvate/ai/remove-bg/',
  },
  openGraph: {
    title: 'Remove Background Free - 100% Private Offline Alternative to iLoveIMG',
    description: 'Isolate subjects and remove backgrounds locally using browser-native AI. Docuvate operates 100% client-side. Your files never touch any server. Free alternative to iLoveIMG and remove.bg.',
    url: 'https://itsrkmahapatra.github.io/Docuvate/ai/remove-bg/',
    siteName: 'Docuvate',
    images: [
      {
        url: 'https://itsrkmahapatra.github.io/Docuvate/assets/developer.png',
        width: 800,
        height: 600,
        alt: 'Remove Background Free - 100% Private Offline Alternative to iLoveIMG',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Remove Background Free - 100% Private Offline Alternative to iLoveIMG',
    description: 'Isolate subjects and remove backgrounds locally using browser-native AI. Docuvate operates 100% client-side. Your files never touch any server. Free alternative to iLoveIMG and remove.bg.',
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
            "name": "Docuvate REMOVE BG",
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
            "description": "Isolate subjects and remove backgrounds locally using browser-native AI. Docuvate operates 100% client-side. Your files never touch any server. Free alternative to iLoveIMG and remove.bg."
          })
        }}
      />
      <PageClient />
    </>
  )
}