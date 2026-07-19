import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms & Conditions - Docuvate Private PDF Tools',
  description: 'Terms & Conditions for using Docuvate - the 100% private offline PDF and Image utility suite.',
  keywords: 'docuvate terms, terms of service, private document tools conditions'
}

export default function Terms() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-6">Terms & Conditions</h1>
      <p className="mb-4">By accessing Docuvate, you agree to these terms:</p>
      <ul className="list-disc pl-6 mb-4 space-y-2">
        <li>The site and all content are proprietary and confidential.</li>
        <li>You may not reproduce, clone, sell, or modify the source code.</li>
        <li>Your use of this site is entirely at your own risk.</li>
        <li>We reserve the right to modify or discontinue tools without notice.</li>
      </ul>
      <p>Last updated: May 18, 2026.</p>
    </div>
  )
}
