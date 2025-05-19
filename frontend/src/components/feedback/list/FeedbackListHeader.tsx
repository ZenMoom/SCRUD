import { PlusCircle } from 'lucide-react';
import Link from 'next/link';

export default function FeedbackListHeader() {
  return (
    <>
      <div className='sm:flex-row sm:items-center sm:justify-between flex flex-col'>
        <div className='sm:mb-0 mb-6'>
          <h1 className='sm:text-4xl md:text-5xl text-3xl font-bold tracking-tight text-gray-900'>
            <span className='bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>피드백</span>{' '}
            게시판
          </h1>
          <p className='mt-2 text-lg text-gray-600'>사용자들의 의견과 제안을 공유하는 공간입니다</p>
        </div>
        <Link
          href='/feedback/new'
          className='py-2.5 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center gap-2 px-4 text-sm font-medium text-white transition-colors bg-blue-600 rounded-lg shadow-sm'
        >
          <PlusCircle className='w-5 h-5' />새 피드백 작성
        </Link>
      </div>
    </>
  );
}
