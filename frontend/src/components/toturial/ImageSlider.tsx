'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';

interface ImageSliderProps {
  images: {
    src: string;
    alt: string;
    caption?: string;
  }[];
  autoPlay?: boolean;
  interval?: number;
}

export function ImageSlider({ images, autoPlay = true, interval = 5000 }: ImageSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? images.length - 1 : prevIndex - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex === images.length - 1 ? 0 : prevIndex + 1));
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  useEffect(() => {
    if (!autoPlay) return;

    const intervalId = setInterval(() => {
      goToNext();
    }, interval);

    return () => clearInterval(intervalId);
  }, [autoPlay, interval]);

  if (images.length === 0) return null;

  return (
    <div className='relative w-full'>
      <div className='aspect-video relative overflow-hidden bg-gray-100 rounded-lg'>
        <Image
          src={images[currentIndex].src || '/placeholder.svg'}
          alt={images[currentIndex].alt}
          width={800}
          height={450}
          className='object-contain w-full h-full'
        />

        {/* Navigation arrows */}
        <button
          onClick={goToPrevious}
          className='left-2 top-1/2 bg-white/80 hover:bg-white absolute p-2 transition-all -translate-y-1/2 rounded-full shadow-md'
          aria-label='Previous slide'
        >
          <ChevronLeft className='w-5 h-5 text-gray-700' />
        </button>

        <button
          onClick={goToNext}
          className='right-2 top-1/2 bg-white/80 hover:bg-white absolute p-2 transition-all -translate-y-1/2 rounded-full shadow-md'
          aria-label='Next slide'
        >
          <ChevronRight className='w-5 h-5 text-gray-700' />
        </button>
      </div>

      {/* Caption */}
      {images[currentIndex].caption && (
        <div className='mt-2 text-sm text-center text-gray-600'>{images[currentIndex].caption}</div>
      )}

      {/* Pagination dots */}
      {images.length > 1 && (
        <div className='gap-1.5 flex justify-center mt-3'>
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                index === currentIndex ? 'bg-blue-500 scale-110' : 'bg-gray-300 hover:bg-gray-400'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
