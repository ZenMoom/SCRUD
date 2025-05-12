"use client"

import { useState, useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'

interface DependencySelectorProps {
  value: string
  onChange: (value: string) => void
}

// Spring 의존성 목록 (spring.io API 샘플 데이터)
const springDependencies = [
  { id: 'web', name: 'Spring Web', description: 'Build web applications using Spring MVC' },
  { id: 'data-jpa', name: 'Spring Data JPA', description: 'Persist data in SQL stores with Java Persistence API' },
  { id: 'security', name: 'Spring Security', description: 'Highly customizable authentication and access-control' },
  { id: 'mysql', name: 'MySQL Driver', description: 'MySQL JDBC driver' },
  { id: 'postgresql', name: 'PostgreSQL Driver', description: 'PostgreSQL JDBC driver' },
  { id: 'lombok', name: 'Lombok', description: 'Java annotation library to reduce boilerplate code' },
  { id: 'thymeleaf', name: 'Thymeleaf', description: 'Server-side Java template engine' },
  { id: 'validation', name: 'Validation', description: 'Bean Validation with Hibernate validator' },
  { id: 'devtools', name: 'Spring Boot DevTools', description: 'Development-time tools for increased productivity' },
  { id: 'actuator', name: 'Spring Boot Actuator', description: 'Monitoring and management for production-ready features' },
  { id: 'data-redis', name: 'Spring Data Redis', description: 'Advanced keyvalue store with optional durability' },
  { id: 'data-mongodb', name: 'Spring Data MongoDB', description: 'Document-based database with JSON-like documents' },
  // 더 많은 의존성 추가 가능
]

export default function DependencySelector({ value, onChange }: DependencySelectorProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [selectedDeps, setSelectedDeps] = useState<string[]>([])
  const dropdownRef = useRef<HTMLDivElement>(null)

  // 컴포넌트 마운트 시 초기값 설정
  useEffect(() => {
    if (value) {
      setSelectedDeps(value.split(',').filter(Boolean))
    }
  }, [value])

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // 필터링된 의존성 목록
  const filteredDependencies = springDependencies.filter(
    (dep) => dep.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // 의존성 토글 (선택/해제)
  const toggleDependency = (id: string) => {
    const newSelected = selectedDeps.includes(id)
      ? selectedDeps.filter((depId) => depId !== id)
      : [...selectedDeps, id]

    setSelectedDeps(newSelected)
    onChange(newSelected.join(','))
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        className="w-full p-3 text-left border border-gray-300 rounded-lg flex justify-between items-center bg-white"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{selectedDeps.length ? `${selectedDeps.length}개 의존성 선택됨` : '의존성 선택...'}</span>
        <span className="ml-2">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <input
                type="text"
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md"
                placeholder="의존성 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute left-2 top-2.5 text-gray-400" size={16} />
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto">
            {filteredDependencies.map((dep) => (
              <label
                key={dep.id}
                className="flex items-center p-3 hover:bg-gray-50 border-b border-gray-200 last:border-b-0 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedDeps.includes(dep.id)}
                  onChange={() => toggleDependency(dep.id)}
                  className="w-4 h-4 mr-3 text-blue-500"
                />
                <div>
                  <div className="font-medium">{dep.name}</div>
                  <div className="text-sm text-gray-500">{dep.description}</div>
                </div>
              </label>
            ))}

            {filteredDependencies.length === 0 && (
              <div className="p-4 text-center text-gray-500">검색 결과가 없습니다</div>
            )}
          </div>
        </div>
      )}

      {/* 선택된 의존성 표시 */}
      {selectedDeps.length > 0 && (
        <div className="mt-3">
          <div className="text-sm font-medium mb-2">선택된 의존성:</div>
          <div className="flex flex-wrap gap-2">
            {selectedDeps.map((id) => {
              const dep = springDependencies.find((d) => d.id === id)
              return (
                <div key={id} className="flex items-center bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-sm">
                  <span>{dep?.name || id}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleDependency(id)
                    }}
                    className="ml-1 text-gray-500 hover:text-gray-700"
                  >
                    <X size={14} />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
} 