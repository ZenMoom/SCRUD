"use client"

import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import React from 'react'
import { useProjectTempStore } from "@/store/projectTempStore"

interface DependencySelectorProps {
  selectedDependencies: string[];
  onChange: (file: { name: string; content: string }) => void;
}

// Spring 의존성 목록
export const springDependencies = [
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

export default function DependencySelector({ selectedDependencies, onChange }: DependencySelectorProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const { tempData, setTempData } = useProjectTempStore();

  // GitHub 인증 후 리다이렉트인 경우에만 임시저장 데이터 불러오기
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isFromGithubAuth = params.get('from') === 'github-auth';
    const isAuthPending = localStorage.getItem('github-auth-pending') === 'true';

    if (isFromGithubAuth && isAuthPending && tempData.dependencySelections?.length > 0) {
      console.log('의존성 선택 임시저장 데이터:', tempData.dependencySelections);
      
      // 파일 객체로 변환하여 전달
      const fileContent = tempData.dependencySelections.map(depId => {
        const dep = springDependencies.find(d => d.id === depId);
        return dep ? `${dep.name} (${dep.id})` : depId;
      }).join('\n');
      
      onChange({
        name: "dependency.txt",
        content: fileContent
      });
    }
  }, []);

  // 검색어에 따른 의존성 필터링
  const filteredDependencies = springDependencies.filter(dep =>
    dep.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dep.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // 의존성 선택/해제 처리
  const toggleDependency = (depId: string) => {
    const newDeps = selectedDependencies.includes(depId)
      ? selectedDependencies.filter(id => id !== depId)
      : [...selectedDependencies, depId];
    
    // 파일 객체로 변환하여 전달
    const fileContent = newDeps.map(depId => {
      const dep = springDependencies.find(d => d.id === depId);
      return dep ? `${dep.name} (${dep.id})` : depId;
    }).join('\n');
    
    onChange({
      name: "dependency.txt",
      content: fileContent
    });

    // 임시저장소에 선택된 의존성 목록 저장
    setTempData({ dependencySelections: newDeps });
  }

  // 드롭다운 외부 클릭 시 닫기
  const handleClickOutside = (e: Event) => {
    const target = e.target as HTMLElement;
    if (!target.closest('.dependency-search-container')) {
      setIsDropdownOpen(false);
    }
  };

  // 이벤트 리스너 등록/해제
  React.useEffect(() => {
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  return (
    <div className="w-full">
      {/* 검색 입력창 */}
      <div className="relative mb-2 dependency-search-container">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          className="w-full pl-10 pr-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="의존성 검색..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsDropdownOpen(true)}
        />

        {/* 의존성 목록 드롭다운 */}
        {isDropdownOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {filteredDependencies.map((dep) => (
              <label
                key={dep.id}
                className="flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
              >
                <input
                  type="checkbox"
                  checked={selectedDependencies.includes(dep.id)}
                  onChange={() => toggleDependency(dep.id)}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <div className="ml-3">
                  <div className="font-medium">{dep.name}</div>
                  <div className="text-sm text-gray-500">{dep.description}</div>
                </div>
              </label>
            ))}
            {filteredDependencies.length === 0 && (
              <div className="px-4 py-3 text-gray-500 text-center">검색 결과가 없습니다</div>
            )}
          </div>
        )}
      </div>

      {/* 선택된 의존성 표시 */}
      {selectedDependencies.length > 0 && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-sm font-medium mb-2">선택된 의존성:</div>
          <div className="flex flex-wrap gap-2">
            {selectedDependencies.map(depId => {
              const dep = springDependencies.find(d => d.id === depId);
              if (!dep) return null;
              return (
                <div
                  key={dep.id}
                  className="flex items-center gap-2 bg-white px-3 py-1 rounded border border-gray-200"
                >
                  <span className="text-sm">{dep.name}</span>
                  <button
                    onClick={() => toggleDependency(dep.id)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  )
} 