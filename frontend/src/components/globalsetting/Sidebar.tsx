'use client';

import { cn } from '@/lib/utils';

interface SidebarProps {
  activeItem: string;
  onItemClick: (item: string) => void;
  completed?: Record<string, boolean>;
}

export default function Sidebar({ activeItem, onItemClick, completed = {} }: SidebarProps) {
  // Reordered items to move security settings and architecture structure to the end
  const items = [
    { id: 'title', label: '프로젝트명', required: true },
    { id: 'description', label: '프로젝트 설명', required: true },
    { id: 'serverUrl', label: 'Server URL', required: true },
    { id: 'requirementSpec', label: '요구사항 명세서', required: true },
    { id: 'erd', label: 'ERD', required: true },
    { id: 'dependencyFile', label: '의존성 파일', required: false },
    { id: 'utilityClass', label: '유틸 클래스', required: false },
    { id: 'errorCode', label: '에러 코드', required: false },
    { id: 'codeConvention', label: '코드 컨벤션', required: false },
    { id: 'securitySetting', label: '보안 설정', required: false },
    { id: 'architectureStructure', label: '아키텍처 구조', required: false },
  ];

  return (
    <aside
      className={cn(
        'bg-white rounded-lg shadow-sm overflow-hidden h-full transition-all duration-300',
        'md:w-64 md:flex-shrink-0 md:static',
        'hidden md:block'
      )}
    >
      <div className='h-full overflow-y-auto'>
        <nav className='p-4'>
          <ul className='space-y-1'>
            {items.map((item) => {
              const isCompleted = completed[item.id];
              const isActive = activeItem === item.id;

              return (
                <li key={item.id}>
                  <button
                    onClick={() => onItemClick(item.id)}
                    className={cn(
                      'w-full text-left px-4 py-3 rounded-md transition-all duration-200',
                      'hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200',
                      isActive ? 'bg-gray-100 font-medium border-l-4 border-blue-500' : 'border-l-4 border-transparent',
                      isCompleted && !isActive && 'border-l-4 border-green-500 bg-green-50'
                    )}
                  >
                    <span className='flex items-center justify-between'>
                      <span className='flex items-center gap-1'>
                        {item.label}
                        {item.required && <span className='ml-1 text-red-500'>*</span>}
                      </span>
                      {isCompleted && (
                        <span
                          className='w-2 h-2 bg-green-500 rounded-full'
                          aria-hidden='true'
                        />
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </aside>
  );
}
