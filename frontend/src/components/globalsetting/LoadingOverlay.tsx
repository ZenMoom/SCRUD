import { Loader2 } from 'lucide-react';

interface LoadingOverlayProps {
  isVisible: boolean;
}

export default function LoadingOverlay({ isVisible }: LoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className='bg-black/50 backdrop-blur-sm fixed inset-0 z-50 flex items-center justify-center'>
      <div className='flex flex-col items-center p-8 bg-white rounded-lg shadow-lg'>
        <Loader2 className='animate-spin w-12 h-12 mb-4 text-blue-600' />
        <p className='text-lg font-medium'>프로젝트를 생성하는 중입니다...</p>
        <p className='mt-2 text-sm text-gray-500'>잠시만 기다려주세요.</p>
      </div>
    </div>
  );
}
