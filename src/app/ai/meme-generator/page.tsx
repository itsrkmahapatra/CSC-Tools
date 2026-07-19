import type { Metadata } from 'next'
import PageClient from './page-client'

export const metadata: Metadata = {
  title: 'Meme Generator Free - 100% Private Alternative to iLoveIMG',
  description: 'Create custom memes locally in your browser. Docuvate operates 100% client-side. Your images never leave your computer. Free offline alternative to iLoveIMG and Meme Generator.',
  keywords: 'meme generator online, make a meme, free meme maker, alternative to iloveimg, private meme generator, offline meme creator',
  alternatives: {
    canonical: 'https://itsrkmahapatra.github.io/Docuvate/ai/meme-generator/',
  },
  openGraph: {
    title: 'Meme Generator Free - 100% Private Alternative to iLoveIMG',
    description: 'Create custom memes locally in your browser. Docuvate operates 100% client-side. Your images never leave your computer. Free offline alternative to iLoveIMG and Meme Generator.',
    url: 'https://itsrkmahapatra.github.io/Docuvate/ai/meme-generator/',
    siteName: 'Docuvate',
    images: [
      {
        url: 'https://itsrkmahapatra.github.io/Docuvate/assets/developer.png',
        width: 800,
        height: 600,
        alt: 'Meme Generator Free - 100% Private Alternative to iLoveIMG',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Meme Generator Free - 100% Private Alternative to iLoveIMG',
    description: 'Create custom memes locally in your browser. Docuvate operates 100% client-side. Your images never leave your computer. Free offline alternative to iLoveIMG and Meme Generator.',
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
            "name": "Docuvate MEME GENERATOR",
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
            "description": "Create custom memes locally in your browser. Docuvate operates 100% client-side. Your images never leave your computer. Free offline alternative to iLoveIMG and Meme Generator."
          })
        }}
      />
      <PageClient />
    </>
  )
}