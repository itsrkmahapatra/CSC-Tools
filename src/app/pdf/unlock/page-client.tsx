'use client'
import { useState } from 'react'
import Dropzone from '@/components/ui/Dropzone'
import WorkspaceLayout from '@/components/ui/WorkspaceLayout'
import { PDFDocument } from 'pdf-lib'

export default function UnlockPDF() {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const handleProcess = async () => {
    if (!file) return
    setIsProcessing(true)
    setErrorMsg('')
    try {
      const arrayBuffer = await file.arrayBuffer()
      // Load PDF with password to decrypt it
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pdf = await PDFDocument.load(arrayBuffer, { password: password || undefined, ignoreEncryption: true } as any)
      
      // Saving it without setting a new password automatically strips the encryption
      const pdfBytes = await pdf.save()
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `unlocked-${file.name}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      console.error(e)
      if (e.message && e.message.includes('Password')) {
        setErrorMsg("Incorrect or missing password. Please provide the correct password to unlock.")
      } else {
        setErrorMsg("Error unlocking PDF. It may be corrupted or use unsupported encryption.")
      }
    } finally {
      setIsProcessing(false)
    }
  }

  if (!file) {
    return (
      <div className="py-24">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-4">Unlock PDF</h1>
        <p className="text-center text-gray-500 mb-8">Strip password protections and restrictions securely in your browser.</p>
        <Dropzone onFilesDrop={(files) => setFile(files[0])} accept="application/pdf" multiple={false} theme="red" label="Select Encrypted PDF" />
      </div>
    )
  }

  return (
    <WorkspaceLayout 
      onProcess={handleProcess} 
      processLabel="Unlock PDF" 
      colorTheme="red"
      isProcessing={isProcessing}
      sidebarContent={
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">Document Password</h3>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="w-full border rounded p-3" 
              placeholder="Enter password to unlock" 
            />
            {errorMsg && <p className="text-red-500 text-xs mt-2">{errorMsg}</p>}
          </div>
          <button onClick={() => { setFile(null); setPassword(''); setErrorMsg('') }} className="text-sm text-red-500 hover:underline">Cancel</button>
        </div>
      }
    >
      <div className="bg-white p-8 rounded-lg shadow-xl border border-gray-200 flex flex-col items-center justify-center relative w-full max-w-sm">
        <div className="text-red-500 mb-4 text-6xl text-center">🔒</div>
        <p className="text-lg text-center text-gray-800 font-bold truncate w-full mt-4">{file.name}</p>
        <p className="text-sm text-gray-500 mt-2 text-center w-full">This document is protected. Enter the password in the settings panel to permanently unlock it.</p>
      </div>
    </WorkspaceLayout>
  )
}
