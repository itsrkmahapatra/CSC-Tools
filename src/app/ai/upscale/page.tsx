import type { Metadata } from 'next'
import PageClient from './page-client'

export const metadata: Metadata = {
  title: 'AI Image Upscaler Free - 100% Private Alternative to ImgUpscaler.ai',
  description: 'Increase image resolution and quality locally using browser-native ESRGAN AI networks. Docuvate operates 100% client-side. Your files never touch any server. Free alternative to ImgUpscaler.ai.',
  keywords: 'imgupscaler alternative, upscale image online, ai image upscaler, alternative to imgupscaler.ai, private image upscaler, offline upscale',
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
            "operatingSystem": "All",
            "applicationCategory": "ImageEditor",
            "browserRequirements": "Requires JavaScript and modern browser context. Runs 100% client-side offline.",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "description": "Increase image resolution and quality locally using browser-native ESRGAN AI networks. Docuvate operates 100% client-side. Your files never touch any server. Free alternative to ImgUpscaler.ai."
          })
        }}
      />
      <PageClient />
    </>
  )
}