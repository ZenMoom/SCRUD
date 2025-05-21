import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ProjectTempData } from './types/project';

interface ProjectTempStore {
  tempData: ProjectTempData;
  setTempData: (data: Partial<ProjectTempData>) => void;
  clearTempData: () => void;
}

const initialState: ProjectTempData = {
  title: '',
  description: '',
  serverUrl: '',
  requirementSpec: [],
  erd: [],
  utilityClass: [],
  codeConvention: [],
  dependencyFile: [],
  dependencySelections: [],
  errorCode: [],
  architectureStructure: {
    type: 'selection',
    selection: { type: 'ARCHITECTURE_DEFAULT_LAYERED_A', label: '레이어드 아키텍처 A - 도메인 중심 구조', imageUrl: '/layered-a.png' }
  },
  securitySetting: {
    type: 'selection',
    selection: { type: 'SECURITY_DEFAULT_JWT', label: 'JWT' }
  }
};

export const useProjectTempStore = create<ProjectTempStore>()(
  persist(
    (set) => ({
      tempData: initialState,
      setTempData: (data) => set((state) => ({
        tempData: { ...state.tempData, ...data }
      })),
      clearTempData: () => set({ tempData: initialState })
    }),
    {
      name: 'project-temp-storage'
    }
  )
); 