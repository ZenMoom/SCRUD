'use client';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function FeedbackBackButton({
  url,
  className,
  description,
}: {
  url?: string;
  className?: string;
  description?: string;
}) {
  const router = useRouter();

  const handleBack = () => {
    if (url) {
      router.push(url);
    }
    router.back();
  };
  return (
    <button
      onClick={handleBack}
      className={`hover:text-blue-600 inline-flex items-center gap-1 mb-6 text-gray-600 transition-colors ${className}`}
    >
      <ArrowLeft className='w-4 h-4' />
      <span>{description}</span>
    </button>
  );
}
