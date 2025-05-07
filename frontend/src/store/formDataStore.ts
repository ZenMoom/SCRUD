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
    (set, get) => ({
      formItems: [],
      
      updateFormItem: (title, value, type = 'text') => set((state) => {
        const itemIndex = state.formItems.findIndex(item => item.title === title);
        
        if (itemIndex !== -1) {
          // 기존 아이템 업데이트
          const updatedItems = [...state.formItems];
          updatedItems[itemIndex] = {
            ...updatedItems[itemIndex],
            value
          };
          return { formItems: updatedItems };
        } else {
          // 새 아이템 추가
          return { 
            formItems: [...state.formItems, { title, value, type }] 
          };
        }
      }),
      
      getFormItemValue: (title) => {
        const item = get().formItems.find(item => item.title === title);
        return item ? item.value : '';
      },
      
      clearFormData: () => set({ formItems: [] }),
    }),
    {
      name: 'global-setting-form-data', // 로컬 스토리지에 저장될 키 이름
    }
  )
); 