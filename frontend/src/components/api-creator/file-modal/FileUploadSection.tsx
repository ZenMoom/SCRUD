"use client"

import { useState } from "react"

interface FileUploadSectionProps {
  fileType: string
  projectId: number
  onSuccess?: () => void
}

export default function FileUploadSection({ fileType, projectId, onSuccess }: FileUploadSectionProps) {
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  const handleFileChange = async (file: File) => {
    try {
      const content = await file.text()
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileName: file.name,
          fileType,
          fileContent: content,
        }),
      })

      if (!response.ok) {
        throw new Error("파일 업로드에 실패했습니다.")
      }

      setSuccess(true)
      onSuccess?.()
    } catch (error) {
      setError(error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.")
    }
  }

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      setFile(file)
      await handleFileChange(file)
    }
  }

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setFile(file)
      await handleFileChange(file)
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded-md">{error}</div>
      )}
      {success && (
        <div className="p-3 bg-green-100 text-green-700 rounded-md">
          파일이 성공적으로 업로드되었습니다.
        </div>
      )}
      <div
        className={`p-8 border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-colors cursor-pointer ${
          dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => document.getElementById("file-input")?.click()}
      >
        <p className="text-gray-500 text-center">
          파일을 드래그하여 놓거나 클릭하여 선택하세요
        </p>
        <input
          id="file-input"
          type="file"
          className="hidden"
          onChange={handleInputChange}
        />
      </div>
      {file && (
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg text-sm text-gray-700">
          <span className="truncate">{file.name}</span>
        </div>
      )}
    </div>
  )
}
