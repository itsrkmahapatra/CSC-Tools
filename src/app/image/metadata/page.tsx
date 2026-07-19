'use client'
import { useState, useEffect } from 'react'
import Dropzone from '@/components/ui/Dropzone'
import WorkspaceLayout from '@/components/ui/WorkspaceLayout'
import { Camera, Calendar, HardDrive, MapPin, Tag, Compass, ExternalLink, Info, Trash2 } from 'lucide-react'

// Helper function to parse EXIF metadata from raw ArrayBuffer
function parseExif(arrayBuffer: ArrayBuffer) {
  const dataView = new DataView(arrayBuffer)
  if (dataView.byteLength < 2 || dataView.getUint16(0) !== 0xFFD8) {
    return null // Not a JPEG
  }

  let offset = 2
  const length = dataView.byteLength
  let app1Offset = -1

  while (offset < length - 2) {
    const marker = dataView.getUint16(offset)
    const markerLength = dataView.getUint16(offset + 2)
    if (marker === 0xFFE1) {
      app1Offset = offset
      break
    }
    offset += 2 + markerLength
  }

  if (app1Offset === -1) return null

  // Verify Exif header "Exif\0\0"
  const exifHeaderOffset = app1Offset + 4
  if (dataView.getUint32(exifHeaderOffset) !== 0x45786966 || dataView.getUint16(exifHeaderOffset + 4) !== 0x0000) {
    return null
  }

  const tiffOffset = exifHeaderOffset + 6
  const tiffHeader = dataView.getUint16(tiffOffset)
  const isLittleEndian = tiffHeader === 0x4949
  if (!isLittleEndian && tiffHeader !== 0x4D4D) {
    return null
  }

  if (dataView.getUint16(tiffOffset + 2, isLittleEndian) !== 0x002A) {
    return null
  }

  const firstIFDOffset = dataView.getUint32(tiffOffset + 4, isLittleEndian)
  const tags: Record<string, any> = {}

  const getTagTypeSize = (type: number) => {
    switch (type) {
      case 1: case 2: case 7: return 1
      case 3: return 2
      case 4: case 9: return 4
      case 5: case 10: return 8
      default: return 1
    }
  }

  const readValue = (valOffset: number, type: number, littleEndian: boolean) => {
    switch (type) {
      case 1: return dataView.getUint8(valOffset)
      case 3: return dataView.getUint16(valOffset, littleEndian)
      case 4: return dataView.getUint32(valOffset, littleEndian)
      default: return null
    }
  }

  const readValuesAtOffset = (offset: number, type: number, count: number, littleEndian: boolean) => {
    if (type === 2) {
      let str = ""
      for (let i = 0; i < count - 1; i++) {
        const char = dataView.getUint8(offset + i)
        if (char === 0) break
        str += String.fromCharCode(char)
      }
      return str.trim()
    }
    if (type === 5 || type === 10) {
      if (count === 1) {
        const num = dataView.getUint32(offset, littleEndian)
        const den = dataView.getUint32(offset + 4, littleEndian)
        return den === 0 ? 0 : num / den
      }
      const vals = []
      for (let i = 0; i < count; i++) {
        const num = dataView.getUint32(offset + i * 8, littleEndian)
        const den = dataView.getUint32(offset + i * 8 + 4, littleEndian)
        vals.push(den === 0 ? 0 : num / den)
      }
      return vals
    }
    const vals = []
    const size = getTagTypeSize(type)
    for (let i = 0; i < count; i++) {
      vals.push(readValue(offset + i * size, type, littleEndian))
    }
    return vals
  }

  const readTagValue = (entryOffset: number, type: number, numValues: number) => {
    if (numValues * getTagTypeSize(type) <= 4) {
      return readValue(entryOffset + 8, type, isLittleEndian)
    } else {
      const valOffset = dataView.getUint32(entryOffset + 8, isLittleEndian)
      return readValuesAtOffset(tiffOffset + valOffset, type, numValues, isLittleEndian)
    }
  }

  const parseGPSSubIFD = (subOffset: number) => {
    if (subOffset + 2 > dataView.byteLength) return
    const numEntries = dataView.getUint16(tiffOffset + subOffset, isLittleEndian)
    let latRefs = "N", lonRefs = "E"
    let lat: any = null, lon: any = null
    let altRef = 0, alt = 0
    
    for (let i = 0; i < numEntries; i++) {
      const entryOffset = tiffOffset + subOffset + 2 + i * 12
      if (entryOffset + 12 > dataView.byteLength) break
      const tag = dataView.getUint16(entryOffset, isLittleEndian)
      const type = dataView.getUint16(entryOffset + 2, isLittleEndian)
      const numValues = dataView.getUint32(entryOffset + 4, isLittleEndian)
      const val = readTagValue(entryOffset, type, numValues)
      
      if (tag === 0x0001) latRefs = val as string
      if (tag === 0x0002) lat = val
      if (tag === 0x0003) lonRefs = val as string
      if (tag === 0x0004) lon = val
      if (tag === 0x0005) altRef = val as number
      if (tag === 0x0006) alt = val as number
    }

    if (lat && Array.isArray(lat) && lat.length >= 3) {
      const d = lat[0], m = lat[1], s = lat[2]
      let decimal = d + m/60 + s/3600
      if (latRefs === "S") decimal = -decimal
      tags["GPSLatitude"] = decimal
    }
    if (lon && Array.isArray(lon) && lon.length >= 3) {
      const d = lon[0], m = lon[1], s = lon[2]
      let decimal = d + m/60 + s/3600
      if (lonRefs === "W") decimal = -decimal
      tags["GPSLongitude"] = decimal
    }
    if (alt) {
      tags["GPSAltitude"] = altRef === 1 ? -alt : alt
    }
  }

  const parseExifSubIFD = (subOffset: number) => {
    if (subOffset + 2 > dataView.byteLength) return
    const numEntries = dataView.getUint16(tiffOffset + subOffset, isLittleEndian)
    for (let i = 0; i < numEntries; i++) {
      const entryOffset = tiffOffset + subOffset + 2 + i * 12
      if (entryOffset + 12 > dataView.byteLength) break
      const tag = dataView.getUint16(entryOffset, isLittleEndian)
      const type = dataView.getUint16(entryOffset + 2, isLittleEndian)
      const numValues = dataView.getUint32(entryOffset + 4, isLittleEndian)
      const val = readTagValue(entryOffset, type, numValues)
      
      if (tag === 0x829A) tags["ExposureTime"] = val
      if (tag === 0x829D) tags["FNumber"] = val
      if (tag === 0x8827) tags["ISO"] = val
      if (tag === 0x9003) tags["DateTimeOriginal"] = val
      if (tag === 0x920A) tags["FocalLength"] = val
      if (tag === 0xA405) tags["FocalLengthIn35mmFilm"] = val
    }
  }

  const parseIFD = (ifdOffset: number) => {
    if (ifdOffset + 2 > dataView.byteLength) return
    const numEntries = dataView.getUint16(tiffOffset + ifdOffset, isLittleEndian)
    for (let i = 0; i < numEntries; i++) {
      const entryOffset = tiffOffset + ifdOffset + 2 + i * 12
      if (entryOffset + 12 > dataView.byteLength) break
      const tag = dataView.getUint16(entryOffset, isLittleEndian)
      const type = dataView.getUint16(entryOffset + 2, isLittleEndian)
      const numValues = dataView.getUint32(entryOffset + 4, isLittleEndian)
      const val = readTagValue(entryOffset, type, numValues)
      
      if (tag === 0x010F) tags["Make"] = val
      if (tag === 0x0110) tags["Model"] = val
      if (tag === 0x0132) tags["DateTime"] = val
      if (tag === 0x8769) {
        const exifSubOffset = dataView.getUint32(entryOffset + 8, isLittleEndian)
        parseExifSubIFD(exifSubOffset)
      }
      if (tag === 0x8825) {
        const gpsOffset = dataView.getUint32(entryOffset + 8, isLittleEndian)
        parseGPSSubIFD(gpsOffset)
      }
    }
  }

  parseIFD(firstIFDOffset)
  return tags
}

export default function ImageMetadata() {
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [exifData, setExifData] = useState<Record<string, any> | null>(null)
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null)

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)

      // Resolve Image dimensions
      const img = new Image()
      img.src = url
      img.onload = () => {
        setDimensions({ width: img.width, height: img.height })
      }

      // Parse EXIF
      file.arrayBuffer().then((buffer) => {
        try {
          const parsed = parseExif(buffer)
          setExifData(parsed)
        } catch (e) {
          console.error("Failed parsing EXIF", e)
          setExifData(null)
        }
      })

      return () => URL.revokeObjectURL(url)
    }
  }, [file])

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + ['Bytes', 'KB', 'MB'][i]
  }

  const formatExposureTime = (val: any) => {
    if (typeof val !== 'number') return val
    if (val >= 1) return `${val}s`
    const roundedReciprocal = Math.round(1 / val)
    return `1/${roundedReciprocal}s`
  }

  const handleProcess = () => {
    alert("Metadata has been fully parsed in your browser. No files have been uploaded to any server.")
  }

  if (!file) {
    return (
      <div className="py-24">
        <h1 className="text-4xl font-black text-center text-gray-800 mb-4 tracking-tight">View Image Metadata</h1>
        <p className="text-center text-gray-500 mb-8 max-w-lg mx-auto">Read and display underlying camera specs, exposure settings, GPS locations, and properties securely in your browser.</p>
        <Dropzone onFilesDrop={(files) => setFile(files[0])} accept="image/jpeg,image/jpg" multiple={false} theme="blue" label="Select JPG Image" />
      </div>
    )
  }

  return (
    <WorkspaceLayout onProcess={handleProcess} processLabel="Properties Inspected" colorTheme="blue" isProcessing={false} sidebarContent={
      <div className="space-y-6">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-4">
          <h3 className="font-bold text-gray-800 text-xs uppercase tracking-widest flex items-center gap-2">
            <Info className="w-4.5 h-4.5 text-blue-500" /> Storage Info
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">File Type:</span>
              <span className="text-gray-800 font-bold">{file.type || 'image/jpeg'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">File Size:</span>
              <span className="text-gray-800 font-bold">{formatSize(file.size)}</span>
            </div>
            {dimensions && (
              <div className="flex justify-between">
                <span className="text-gray-500">Dimensions:</span>
                <span className="text-gray-800 font-bold">{dimensions.width} x {dimensions.height} px</span>
              </div>
            )}
          </div>
        </div>

        <div className="p-2 space-y-4">
          <div className="flex items-start gap-2 text-[10px] text-gray-400 leading-relaxed bg-gray-50 p-3 rounded-lg border border-dashed">
            <Tag className="w-4 h-4 text-blue-400 shrink-0" />
            <span>EXIF (Exchangeable Image File Format) stores details about camera settings, dates, and geographic locations inside the picture itself.</span>
          </div>
          <button onClick={() => { setFile(null); setExifData(null); setDimensions(null); }} className="w-full text-xs font-bold text-red-500 py-2 hover:bg-red-50 rounded-lg transition-all flex items-center justify-center gap-2 border border-dashed border-red-200">
            <Trash2 className="w-3.5 h-3.5" /> Clear & Start Over
          </button>
        </div>
      </div>
    }>
      <div className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row gap-6 p-4">
        {/* Visual Preview */}
        <div className="flex-1 bg-white p-4 border rounded-2xl shadow-sm flex items-center justify-center min-h-[40vh] max-h-[60vh]">
          {previewUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="EXIF Source Preview" className="max-w-full max-h-[50vh] object-contain rounded-lg shadow-sm" />
          )}
        </div>

        {/* EXIF Data Visual Grid */}
        <div className="flex-1 bg-white p-6 border rounded-2xl shadow-sm space-y-6 overflow-y-auto">
          <div>
            <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2 border-b pb-3">
              <Camera className="w-6 h-6 text-blue-500" /> EXIF Properties
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 rounded-xl border">
              <p className="text-[10px] font-bold text-gray-400 uppercase">Camera Manufacturer</p>
              <p className="text-sm font-bold text-gray-800 mt-1">{exifData?.Make || <span className="text-gray-400 italic">Unknown</span>}</p>
            </div>

            <div className="p-3 bg-gray-50 rounded-xl border">
              <p className="text-[10px] font-bold text-gray-400 uppercase">Camera Model</p>
              <p className="text-sm font-bold text-gray-800 mt-1">{exifData?.Model || <span className="text-gray-400 italic">Unknown</span>}</p>
            </div>

            <div className="p-3 bg-gray-50 rounded-xl border">
              <p className="text-[10px] font-bold text-gray-400 uppercase">Aperture</p>
              <p className="text-sm font-bold text-gray-800 mt-1">{exifData?.FNumber ? `f/${exifData.FNumber}` : <span className="text-gray-400 italic">Unknown</span>}</p>
            </div>

            <div className="p-3 bg-gray-50 rounded-xl border">
              <p className="text-[10px] font-bold text-gray-400 uppercase">Exposure Time</p>
              <p className="text-sm font-bold text-gray-800 mt-1">{exifData?.ExposureTime ? formatExposureTime(exifData.ExposureTime) : <span className="text-gray-400 italic">Unknown</span>}</p>
            </div>

            <div className="p-3 bg-gray-50 rounded-xl border">
              <p className="text-[10px] font-bold text-gray-400 uppercase">ISO Rating</p>
              <p className="text-sm font-bold text-gray-800 mt-1">{exifData?.ISO ? `ISO ${exifData.ISO}` : <span className="text-gray-400 italic">Unknown</span>}</p>
            </div>

            <div className="p-3 bg-gray-50 rounded-xl border">
              <p className="text-[10px] font-bold text-gray-400 uppercase">Focal Length</p>
              <p className="text-sm font-bold text-gray-800 mt-1">
                {exifData?.FocalLength ? (
                  `${exifData.FocalLength} mm ${exifData.FocalLengthIn35mmFilm ? `(35mm equiv: ${exifData.FocalLengthIn35mmFilm}mm)` : ''}`
                ) : (
                  <span className="text-gray-400 italic">Unknown</span>
                )}
              </p>
            </div>

            <div className="p-3 bg-gray-50 rounded-xl border md:col-span-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase">Date & Time Taken</p>
              <p className="text-sm font-bold text-gray-800 mt-1 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-gray-400" />
                {exifData?.DateTimeOriginal || exifData?.DateTime || new Date(file.lastModified).toLocaleString()}
              </p>
            </div>
          </div>

          {/* GPS Coordinates Section */}
          <div className="border-t pt-6 space-y-4">
            <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider flex items-center gap-2">
              <Compass className="w-4.5 h-4.5 text-blue-500" /> GPS Coordinates
            </h3>

            {exifData?.GPSLatitude && exifData?.GPSLongitude ? (
              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                    <MapPin className="w-4.5 h-4.5 text-blue-600" />
                    {exifData.GPSLatitude.toFixed(6)}°, {exifData.GPSLongitude.toFixed(6)}°
                  </p>
                  {exifData.GPSAltitude && (
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Altitude: {exifData.GPSAltitude.toFixed(1)}m</p>
                  )}
                </div>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${exifData.GPSLatitude},${exifData.GPSLongitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 px-4 rounded-lg flex items-center gap-1.5 transition-all shadow-md shrink-0 hover:scale-105 active:scale-100"
                >
                  Locate on Google Maps <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            ) : (
              <div className="bg-gray-50 p-4 rounded-xl border text-center text-xs text-gray-400 italic">
                No geolocation data embedded in this file. GPS tags are usually omitted or stripped by messaging systems.
              </div>
            )}
          </div>
        </div>
      </div>
    </WorkspaceLayout>
  )
}
