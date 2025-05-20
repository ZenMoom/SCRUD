import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingOverlayProps {
  isVisible: boolean;
}

const messages = [
  "프로젝트 정보를 읽는 중입니다......",
  "요구사항 명세서에서 필요 api 목록을 추출하는 중입니다......",
  "ERD의 정보를 읽어 데이터베이스 구조를 분석하는 중입니다......",
  "프로젝트를 생성하는 중입니다. 조금만 기다려 주세요."
];

export default function LoadingOverlay({ isVisible }: LoadingOverlayProps) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isMessageVisible, setIsMessageVisible] = useState(true);

  useEffect(() => {
    if (!isVisible) return;

    // 메시지 변경 타이머
    const messageTimer = setInterval(() => {
      setIsMessageVisible(false);
      
      // 페이드아웃 후 메시지 변경
      setTimeout(() => {
        setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
        setIsMessageVisible(true);
      }, 500); // 페이드아웃 애니메이션 시간
      
    }, 8000); // 8초마다 메시지 변경

    return () => {
      clearInterval(messageTimer);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex flex-col items-center justify-center">
      <div className="text-white mb-8">
        <Loader2 className="w-16 h-16 animate-spin" />
      </div>
      <div 
        className={`text-white text-lg transition-opacity duration-500 text-center max-w-lg
          ${isMessageVisible ? 'opacity-100' : 'opacity-0'}`}
      >
        {messages[currentMessageIndex]}
      </div>
    </div>
  );
} 