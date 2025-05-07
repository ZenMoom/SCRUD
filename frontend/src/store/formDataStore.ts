import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 폼 아이템 데이터 인터페이스
interface FormItemData {
  title: string;
  value: string;
  type: string;
}

interface FormDataState {
  formItems: FormItemData[];
  updateFormItem: (title: string, value: string, type?: string) => void;
  getFormItemValue: (title: string) => string;
  clearFormData: () => void;
}

export const useFormDataStore = create<FormDataState>()(
  persist(
    (set) => ({
      formItems: [], 
      
      updateFormItem: () => {
        // 기능 비활성화 - 저장하지 않음
      },
      
      getFormItemValue: () => {
        // 항상 빈 문자열 반환
        return '';
      },
      
      clearFormData: () => set({ formItems: [] }),
    }),
    {
      name: 'global-setting-form-data',
      storage: {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {}
      }
    }
  )
); 