import { useRef, useState, type DragEvent } from 'react'
import Button from '../ui/Button'

interface FileDropzoneProps {
  onFileSelected: (file: File) => void
  loading: boolean
}

const ACCEPTED = ['.pdf', '.xlsx']
const ACCEPTED_MIME = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]

function isAccepted(file: File) {
  return (
    ACCEPTED_MIME.includes(file.type) ||
    ACCEPTED.some((ext) => file.name.toLowerCase().endsWith(ext))
  )
}

export default function FileDropzone({ onFileSelected, loading }: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState('')

  function handleFile(file: File) {
    if (!isAccepted(file)) {
      setFileError('Only PDF and XLSX files are supported.')
      return
    }
    setFileError('')
    setSelectedFile(file)
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition-colors ${
          dragOver
            ? 'border-blue-400 bg-blue-50'
            : 'border-slate-300 bg-white hover:border-blue-300 hover:bg-slate-50'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.xlsx"
          className="hidden"
          onChange={handleInputChange}
        />
        <div className="flex flex-col items-center gap-2">
          <svg
            className="h-10 w-10 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
            />
          </svg>
          {selectedFile ? (
            <div>
              <p className="font-medium text-slate-900">{selectedFile.name}</p>
              <p className="text-xs text-slate-500">
                {(selectedFile.size / 1024).toFixed(1)} KB — click to change
              </p>
            </div>
          ) : (
            <div>
              <p className="text-sm font-medium text-slate-700">
                Drag & drop or click to upload
              </p>
              <p className="text-xs text-slate-400 mt-1">PDF or XLSX files only</p>
            </div>
          )}
        </div>
      </div>

      {fileError && (
        <p className="text-sm text-red-600">{fileError}</p>
      )}

      <Button
        onClick={() => selectedFile && onFileSelected(selectedFile)}
        disabled={!selectedFile}
        loading={loading}
        className="self-end"
      >
        Analyze File
      </Button>
    </div>
  )
}
