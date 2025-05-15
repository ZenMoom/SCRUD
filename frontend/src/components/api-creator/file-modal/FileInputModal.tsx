"use client"

import { useState, useEffect, useRef } from "react"
import GitHubRepoBrowser from "@/components/globalsetting/GitHubRepoBrowser"
import FileUploadSection from "./FileUploadSection"

interface FileInputModalProps {
  isOpen: boolean
  onClose: () => void
  fileType: string
  projectId: number
  onSuccess?: () => void
}

export default function FileInputModal({ isOpen, onClose, fileType, projectId, onSuccess }: FileInputModalProps) {
  const [selectedOption, setSelectedOption] = useState<'github' | 'upload' | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!selectedOption && dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [onClose, selectedOption])

  if (!isOpen) return null

  return (
    <>
      <div 
        ref={dropdownRef}
        className={`absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg ${selectedOption === 'github' ? 'hidden' : 'z-50'}`}
        style={{
          top: '100%',
        }}
      >
        {!selectedOption ? (
          <div className="py-1">
            <button
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
              onClick={() => setSelectedOption('github')}
            >
              GitHub에서 가져오기
            </button>
            <button
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
              onClick={() => setSelectedOption('upload')}
            >
              파일 업로드
            </button>
          </div>
        ) : selectedOption === 'upload' ? (
          <div className="p-4">
            <FileUploadSection 
              fileType={fileType}
              projectId={projectId}
              onSuccess={() => {
                onSuccess?.()
                onClose()
              }}
            />
            
            <button
              onClick={() => setSelectedOption(null)}
              className="mt-4 w-full p-2 text-gray-600 hover:text-gray-800 text-sm"
            >
              다른 옵션 선택하기
            </button>
          </div>
        ) : null}
      </div>

      {selectedOption === 'github' && (
        <GitHubRepoBrowser 
          isOpen={true}
          onClose={() => {
            setSelectedOption(null)
            onClose()
          }}
          onSelect={() => {
            onSuccess?.()
            onClose()
          }}
          formType={fileType}
          isArchitecture={fileType === 'ARCHITECTURE_DEFAULT'}
        />
      )}
    </>
  )
}
