import type { Metadata } from 'next'
import PageClient from './page-client'

export const metadata: Metadata = {
  title: 'Photo Editor Free - 100% Private Alternative to iLoveIMG & Canva',
  description: 'Edit photos, adjust filters, and add annotations locally. Docuvate operates 100% client-side. Your photos never touch any server. Free alternative to iLoveIMG and Canva.',
  keywords: 'photo editor online, edit photo online, free image editor, alternative to iloveimg, private image editor, offline photo editor',
  alternatives: {
    canonical: 'https://itsrkmahapatra.github.io/Docuvate/ai/photo-editor/',
  },
  openGraph: {
    title: 'Photo Editor Free - 100% Private Alternative to iLoveIMG & Canva',
    description: 'Edit photos, adjust filters, and add annotations locally. Docuvate operates 100% client-side. Your photos never touch any server. Free alternative to iLoveIMG and Canva.',
    url: 'https://itsrkmahapatra.github.io/Docuvate/ai/photo-editor/',
    siteName: 'Docuvate',
    images: [
      {
        url: 'https://itsrkmahapatra.github.io/Docuvate/assets/developer.png',
        width: 800,
        height: 600,
        alt: 'Photo Editor Free - 100% Private Alternative to iLoveIMG & Canva',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Photo Editor Free - 100% Private Alternative to iLoveIMG & Canva',
    description: 'Edit photos, adjust filters, and add annotations locally. Docuvate operates 100% client-side. Your photos never touch any server. Free alternative to iLoveIMG and Canva.',
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
            "name": "Docuvate PHOTO EDITOR",
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
            "description": "Edit photos, adjust filters, and add annotations locally. Docuvate operates 100% client-side. Your photos never touch any server. Free alternative to iLoveIMG and Canva."
          })
        }}
      />
      <PageClient />
    </>
  )
}