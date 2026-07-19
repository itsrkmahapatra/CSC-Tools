import type { Metadata } from 'next'
import PageClient from './page-client'

export const metadata: Metadata = {
  title: 'AI Image Upscaler Free - 100% Private Alternative to ImgUpscaler.ai',
  description: 'Increase image resolution and quality locally using browser-native ESRGAN AI networks. Docuvate operates 100% client-side. Your files never touch any server. Free alternative to ImgUpscaler.ai.',
  keywords: 'imgupscaler alternative, upscale image online, ai image upscaler, alternative to imgupscaler.ai, private image upscaler, offline upscale',
  alternatives: {
    canonical: 'https://itsrkmahapatra.github.io/Docuvate/ai/upscale/',
  },
  openGraph: {
    title: 'AI Image Upscaler Free - 100% Private Alternative to ImgUpscaler.ai',
    description: 'Increase image resolution and quality locally using browser-native ESRGAN AI networks. Docuvate operates 100% client-side. Your files never touch any server. Free alternative to ImgUpscaler.ai.',
    url: 'https://itsrkmahapatra.github.io/Docuvate/ai/upscale/',
    siteName: 'Docuvate',
    images: [
      {
        url: 'https://itsrkmahapatra.github.io/Docuvate/assets/developer.png',
        width: 800,
        height: 600,
        alt: 'AI Image Upscaler Free - 100% Private Alternative to ImgUpscaler.ai',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Image Upscaler Free - 100% Private Alternative to ImgUpscaler.ai',
    description: 'Increase image resolution and quality locally using browser-native ESRGAN AI networks. Docuvate operates 100% client-side. Your files never touch any server. Free alternative to ImgUpscaler.ai.',
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
            "name": "Docuvate UPSCALE",
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
            "description": "Increase image resolution and quality locally using browser-native ESRGAN AI networks. Docuvate operates 100% client-side. Your files never touch any server. Free alternative to ImgUpscaler.ai."
          })
        }}
      />
      <PageClient />
    </>
  )
}