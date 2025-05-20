"use client"

import { useEffect } from 'react'
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
]

export default function DependencySelector({ selectedDependencies, onChange }: DependencySelectorProps) {
  const { tempData, setTempData } = useProjectTempStore();

  // GitHub 인증 후 리다이렉트인 경우에만 임시저장 데이터 불러오기
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isFromGithubAuth = params.get('from') === 'github-auth';
    const isAuthPending = localStorage.getItem('github-auth-pending') === 'true';

    if (isFromGithubAuth && isAuthPending && tempData.dependencySelections?.length > 0) {

      
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

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {springDependencies.map((dep) => (
          <button
            key={dep.id}
            onClick={() => toggleDependency(dep.id)}
            className={`flex flex-col items-start w-full p-3 rounded-lg border transition-colors duration-200 hover:bg-gray-50 ${
              selectedDependencies.includes(dep.id)
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200'
            }`}
          >
            <div className="font-medium text-sm text-left w-full">
              {dep.name}
              {selectedDependencies.includes(dep.id) && (
                <span className="ml-2 text-blue-500">✓</span>
              )}
            </div>
            <div className="text-xs text-gray-500 mt-1 text-left w-full">{dep.description}</div>
          </button>
        ))}
      </div>
    </div>
  )
} 