import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ProjectTempData, FileData, SelectionValue } from './types/project';

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
  errorCode: [],
  architectureStructure: [],
  securitySetting: []
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