// EmojiPicker 컴포넌트 수정 - 포탈을 사용하여 스크롤 컨텍스트에서 벗어나게 함

"use client"

import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"

interface EmojiPickerProps {
  selectedEmoji: string
  onEmojiSelect: (emoji: string) => void
}

// 이모지 카테고리 데이터 (기존과 동일)
const emojiCategories = [
  {
    name: "일반",
    emojis: ["📊", "📈", "🚀", "💡", "✨", "🔍", "📱", "💻", "🎨", "🛠️"],
  },
  {
    name: "도구",
    emojis: ["⚙️", "🔧", "🔨", "📌", "📋", "📂", "📁", "🗃️", "🗄️", "📮"],
  },
  {
    name: "표현",
    emojis: ["👍", "👏", "🙌", "🎉", "🎊", "🏆", "💯", "✅", "⭐", "🌟"],
  },
]

export default function EmojiPicker({ selectedEmoji, onEmojiSelect }: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState(0)
  const pickerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [dropdownPosition, setDropdownPosition] = useState({ left: 0, top: 0 })
  const [portalElement, setPortalElement] = useState<HTMLElement | null>(null)

  // 페이지 로드 시 portal 엘리먼트 설정
  useEffect(() => {
    setPortalElement(document.body)
  }, [])

  // 버튼 위치 기반으로 드롭다운 위치 계산
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setDropdownPosition({
        left: rect.left,
        top: rect.bottom + 5,
      })
    }
  }, [isOpen])

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node) && buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
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
      <button
        ref={buttonRef}
        type="button"
        className="p-2 bg-white border border-gray-200 rounded-md hover:bg-gray-50 text-2xl focus:outline-none focus:ring-2 focus:ring-blue-400"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedEmoji || "📌"}
      </button>

      {/* 이모지 선택 드롭다운 - 포탈 사용 */}
      {isOpen &&
        portalElement &&
        createPortal(
          <div
            className="fixed bg-white border border-gray-200 rounded-md shadow-lg w-[280px]"
            style={{
              zIndex: 9999, // 매우 높은 z-index 값
              left: dropdownPosition.left,
              top: dropdownPosition.top,
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
          </div>,
          portalElement
        )}
    </div>
  )
}
