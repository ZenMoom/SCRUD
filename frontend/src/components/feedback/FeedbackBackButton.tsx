'use client';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function FeedbackBackButton({ className, description }: { className?: string; description?: string }) {
  const router = useRouter();
  return (
    <button
      onClick={() => router.back()}
      className={`hover:text-blue-600 inline-flex items-center gap-1 mb-6 text-gray-600 transition-colors ${className}`}
    >
      <ArrowLeft className='w-4 h-4' />
      <span>{description}</span>
    </button>
  );
}
