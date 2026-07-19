import type { Metadata } from 'next'
import PageClient from './page-client'

export const metadata: Metadata = {
  title: 'Meme Generator Free - 100% Private Alternative to iLoveIMG',
  description: 'Create custom memes locally in your browser. Docuvate operates 100% client-side. Your images never leave your computer. Free offline alternative to iLoveIMG and Meme Generator.',
  keywords: 'meme generator online, make a meme, free meme maker, alternative to iloveimg, private meme generator, offline meme creator',
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
            "operatingSystem": "All",
            "applicationCategory": "ImageEditor",
            "browserRequirements": "Requires JavaScript and modern browser context. Runs 100% client-side offline.",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "description": "Create custom memes locally in your browser. Docuvate operates 100% client-side. Your images never leave your computer. Free offline alternative to iLoveIMG and Meme Generator."
          })
        }}
      />
      <PageClient />
    </>
  )
}