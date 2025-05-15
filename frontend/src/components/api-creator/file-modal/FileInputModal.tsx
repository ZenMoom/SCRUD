"use client"

import { useState, useEffect, useRef } from "react"
import GitHubRepoBrowser from "@/components/globalsetting/GitHubRepoBrowser"
import DependencySelector from "@/components/globalsetting/form/DependencySelector"
import { Upload } from 'lucide-react'
import useAuthStore from "@/app/store/useAuthStore"

interface FileInputModalProps {
  isOpen: boolean
  onClose: () => void
  fileType: string
  projectId: number
  onSuccess?: () => void
}

export default function FileInputModal({ isOpen, onClose, fileType, projectId, onSuccess }: FileInputModalProps) {
  const [selectedOption, setSelectedOption] = useState<'github' | 'file' | null>(null)
  const [selectedDependencies, setSelectedDependencies] = useState<string[]>([])
  const dropdownRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { token, isAuthenticated } = useAuthStore()

  const isDependencyFile = fileType === 'DEPENDENCY'

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

  const handleFileSelect = async (files: Array<{ path: string; content: string; fileType?: string; fileName?: string; isGitHub: boolean }>) => {
    console.log('FileInputModal - GitHub에서 받은 파일 데이터:', files);
    
    try {
      for (const file of files) {
        const requestBody = {
          globalFileId: 0,
          fileName: file.fileName || file.path.split('/').pop(),
          fileType: file.fileType || fileType,
          fileContent: file.content,
          isGitHub: true
        };
        
        if (!token || !isAuthenticated) {
           return;
        }

        console.log('FileInputModal - API 요청 데이터:', requestBody);
        
        const response = await fetch(`/api/projects/${projectId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(requestBody),
        });

        console.log('FileInputModal - API 응답:', response);
        
        if (!response.ok) {
          throw new Error('파일 업로드 실패');
        }
      }

      console.log('FileInputModal - 모든 파일 업로드 완료');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('FileInputModal - 파일 업로드 중 오류:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const content = await file.text();
      
      const requestBody = {
        globalFileId: 0,
        fileName: file.name,
        fileType: fileType,
        fileContent: content,
        isGitHub: false
      };

      console.log('FileInputModal - 파일 업로드 요청 데이터:', requestBody);

      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error('파일 업로드 실패');
      }

      console.log('FileInputModal - 파일 업로드 완료');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('FileInputModal - 파일 업로드 중 오류:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {isDependencyFile && !selectedOption ? (
        <div 
          ref={dropdownRef}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <div className="bg-white rounded-lg p-6 w-[500px] max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">의존성 추가</h2>
            <DependencySelector
              selectedDependencies={selectedDependencies}
              onDependencyChange={setSelectedDependencies}
            />
            <div className="mt-6 flex justify-between items-center">
              <button
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm"
                onClick={() => setSelectedOption('file')}
              >
                파일로 추가하기
              </button>
              <div className="flex gap-2">
                <button
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm"
                  onClick={onClose}
                >
                  취소
                </button>
                <button
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm"
                  onClick={() => {
                    // Handle dependency selection submission
                    console.log('Selected dependencies:', selectedDependencies)
                    onSuccess?.()
                    onClose()
                  }}
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div 
            ref={dropdownRef}
            className={`absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg ${selectedOption === 'github' ? 'hidden' : 'z-50'}`}
            style={{
              top: '100%',
            }}
          >
            <div className="py-1">
              <button
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center"
                onClick={() => setSelectedOption('github')}
              >
                <Upload size={16} className="mr-2" />
                GitHub에서 가져오기
              </button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileUpload}
              />
              <button
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={16} className="mr-2" />
                파일 업로드
              </button>
            </div>
          </div>

          {selectedOption === 'github' && (
            <GitHubRepoBrowser 
              isOpen={true}
              onClose={() => {
                setSelectedOption(null)
                onClose()
              }}
              onSelect={handleFileSelect}
              formType={fileType}
              isArchitecture={fileType === 'ARCHITECTURE_DEFAULT'}
            />
          )}
        </>
      )}
    </>
  )
}
