"use client"

import { X } from "lucide-react"

interface InfoModalProps {
  title: string
  description: string
  onClose: () => void
}

export default function InfoModal({ description, onClose }: InfoModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] animate-fade-in">
      <div className="bg-white rounded-lg w-[90%] max-w-[500px] shadow-xl overflow-hidden animate-slide-in">
        <div className="flex justify-end p-2">
          <button 
            type="button" 
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors duration-200" 
            onClick={onClose} 
            aria-label="닫기"
          >
            <X size={20} />
          </button>
        </div>
        <div className="px-6 pb-6 text-base leading-relaxed text-gray-700">
          <p>{description}</p>
        </div>
      </div>
    </div>
  )
}
