'use client';

import useAuthStore from '@/app/store/useAuthStore';
import ApiCreator from '@/components/api-creator/ApiCreator';
import ApiHeader from '@/components/header/apiheader';
import axios from 'axios';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface ProjectInfo {
  id: number;
  title: string;
  description?: string;
  serverUrl?: string;
}

interface GlobalFile {
  globalFileId: number;
  fileName: string;
  fileType: string;
  fileUrl?: string;
  fileContent: string;
}

export default function ProjectApiPage() {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuthStore();
  const [projectInfo, setProjectInfo] = useState<ProjectInfo | null>(null);
  const [globalFiles, setGlobalFiles] = useState<GlobalFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 문자열 ID를 숫자로 변환
  const projectId = params.id ? parseInt(params.id as string, 10) : 0;

  // 프로젝트 정보 로드
  useEffect(() => {
    const fetchProjectData = async () => {
      if (!projectId || isNaN(projectId)) {
        setError('유효하지 않은 프로젝트 ID입니다');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await fetch(`/api/projects/${projectId}`, {
          headers: {
            Authorization: `Bearer ${token}` || '',
          },
        });

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }

        const data = await response.json();

        setProjectInfo({
          id: projectId,
          title: data.project.title,
          description: data.project.description,
          serverUrl: data.project.serverUrl,
        });
        setGlobalFiles(data.content || []);

        // API 스펙이 존재하는지 확인 (404 에러를 방지하기 위함)
        try {
          await axios.get(`/api/api-specs/by-project/${projectId}`, {
            headers: {
              Authorization: `Bearer ${token}` || '',
            },
          });
        } catch {
          // Axios 오류 처리는 유지 (404 오류는 정상적인 플로우의 일부임)
        }
      } catch {
        setError('프로젝트 정보를 불러오는 중 오류가 발생했습니다');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjectData();
  }, [projectId, token]);

  // 로딩 중 표시
  if (isLoading) {
    return (
      <div className='flex items-center justify-center h-screen'>
        <div className='animate-spin w-12 h-12 border-t-2 border-b-2 border-blue-500 rounded-full'></div>
        <span className='ml-3 text-lg text-gray-700'>프로젝트 정보를 불러오는 중...</span>
      </div>
    );
  }

  // 오류 발생 시 표시
  if (error || !projectInfo) {
    return (
      <div className='flex flex-col items-center justify-center h-screen'>
        <div className='mb-4 text-xl text-red-600'>{error || '프로젝트를 찾을 수 없습니다'}</div>
        <button
          onClick={() => router.push('/')}
          className='hover:bg-blue-600 px-4 py-2 text-white transition-colors bg-blue-500 rounded-md'
        >
          메인으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <>
      <ApiHeader project={projectInfo} />
      <main className='p-0'>
        <ApiCreator
          projectId={projectId}
          globalFiles={globalFiles}
        />
      </main>
    </>
  );
}
