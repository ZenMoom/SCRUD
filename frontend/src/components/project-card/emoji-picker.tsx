"use client"

import { useState, useRef, useEffect } from "react"

// 이모지 카테고리와 이모지 목록
const emojiCategories = [
  {
    name: "자주 사용",
    emojis: ["📊", "📈", "🚀", "💡", "✨", "🔍", "📱", "💻", "🎨", "🛠️"],
  },
  {
    name: "도구",
    emojis: ["🛠️", "⚙️", "🔧", "🔨", "🔩", "⚡", "🔌", "💾", "💿", "📀", "🧰", "🧲", "🔭", "🔬", "📡"],
  },
  {
    name: "기술",
    emojis: ["💻", "📱", "⌨️", "🖥️", "🖨️", "💽", "📷", "📹", "🎥", "📺", "📻", "📟", "📠", "🔋", "🔌"],
  },
  {
    name: "그래프",
    emojis: ["📊", "📈", "📉", "📋", "📌", "📍", "📎", "📏", "📐", "✂️", "🔒", "🔓", "🔏", "🔐", "🔑"],
  },
  {
    name: "아이디어",
    emojis: ["💡", "✨", "🎯", "🧩", "💭", "🎪", "🎨", "🎭", "🎤", "🎧", "🎼", "🎹", "🎷", "🎸", "🎻"],
  },
  {
    name: "성과",
    emojis: ["🏆", "🥇", "🥈", "🥉", "🏅", "🎖️", "🏵️", "🎗️", "📯", "🎊", "🎉", "✅", "⭐", "🌟", "🔥"],
  },
]

interface EmojiPickerProps {
  selectedEmoji: string
  onEmojiSelect: (emoji: string) => void
}

export default function EmojiPicker({ selectedEmoji, onEmojiSelect }: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState(0)
  const pickerRef = useRef<HTMLDivElement>(null)

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  return (
    <div className="relative" ref={pickerRef}>
      {/* 선택된 이모지 표시 버튼 */}
      <button type="button" className="p-2 bg-white border border-gray-200 rounded-md hover:bg-gray-50 text-2xl focus:outline-none focus:ring-2 focus:ring-blue-400" onClick={() => setIsOpen(!isOpen)}>
        {selectedEmoji || "📌"}
      </button>

      {/* 이모지 선택 드롭다운 - 수정된 부분 */}
      {isOpen && (
        <div
          className="fixed bg-white border border-gray-200 rounded-md shadow-lg w-[280px]"
          style={{
            zIndex: 9999,
            left: pickerRef.current ? pickerRef.current.getBoundingClientRect().left : 0,
            top: pickerRef.current ? pickerRef.current.getBoundingClientRect().bottom + 5 : 0,
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
          }}
        >
          {/* 카테고리 탭 */}
          <div className="flex border-b border-gray-200 bg-gray-50">
            {emojiCategories.map((category, index) => (
              <button
                key={category.name}
                className={`flex-1 p-2 text-xs font-medium ${activeCategory === index ? "bg-white border-b-2 border-blue-500" : "text-gray-500 hover:bg-gray-100"}`}
                onClick={() => setActiveCategory(index)}
              >
                {category.name}
              </button>
            ))}
          </div>

          {/* 이모지 그리드 */}
          <div className="p-2 max-h-[200px] overflow-y-auto">
            <div className="grid grid-cols-6 gap-1">
              {emojiCategories[activeCategory].emojis.map((emoji) => (
                <button
                  key={emoji}
                  className={`p-2 text-xl hover:bg-gray-100 rounded ${selectedEmoji === emoji ? "bg-blue-100" : ""}`}
                  onClick={() => {
                    onEmojiSelect(emoji)
                    setIsOpen(false)
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
