import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Disclaimer - Docuvate Private PDF Tools',
  description: 'Disclaimer of warranty and liability for using Docuvate - the 100% private offline PDF and Image utility suite.',
  keywords: 'docuvate disclaimer, liability disclaimer, private document tools warranty'
}

export default function Disclaimer() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-6">Disclaimer</h1>
      <p className="mb-4">Docuvate is provided &quot;as is&quot; without any warranties of any kind. By using this website, you acknowledge that all processing is done locally in your browser. We do not store, view, or process any of your files on external servers.</p>
      <p className="mb-4">The author, Raj Kishor Mahapatra, is not responsible for any data loss, file corruption, or any other issues that may arise from using these tools. Use at your own risk.</p>
      <Link href="/" className="text-red-600 font-bold hover:underline">Back to Home</Link>
    </div>
  )
}
