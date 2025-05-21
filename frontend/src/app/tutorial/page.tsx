'use client';

import { ImageSlider } from '@/components/toturial/ImageSlider';
import { Check, ChevronLeft, ChevronRight, Home } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

// 튜토리얼 단계 정의
const steps = [
  {
    id: 'intro',
    title: 'SCRUD 소개',
    description: 'SCRUD 서비스의 개요와 주요 기능을 알아봅니다.',
  },
  {
    id: 'project-creation',
    title: '프로젝트 생성',
    description: '새로운 프로젝트를 생성하는 방법을 알아봅니다.',
  },
  {
    id: 'project-config',
    title: '프로젝트 설정',
    description: '프로젝트의 기본 설정과 요구사항을 정의합니다.',
  },
  {
    id: 'api-creation',
    title: 'API 생성',
    description: 'API를 생성하고 엔드포인트를 정의합니다.',
  },
  {
    id: 'api-visualization',
    title: 'API 도식화',
    description: 'API의 구조와 흐름을 시각적으로 확인합니다.',
  },
  {
    id: 'code-generation',
    title: 'Spring 코드 생성',
    description: '정의된 API를 기반으로 Spring 코드를 자동 생성합니다.',
  },
  {
    id: 'conclusion',
    title: '마무리',
    description: 'SCRUD 서비스의 활용 방법과 다음 단계를 알아봅니다.',
  },
];

export default function TutorialPage() {
  const [currentStep, setCurrentStep] = useState(0);

  const goToNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  const goToStep = (index: number) => {
    setCurrentStep(index);
    window.scrollTo(0, 0);
  };

  return (
    <div className='bg-gradient-to-b from-blue-50 to-white min-h-screen'>
      {/* 헤더 */}
      <header className='bg-white shadow-sm'>
        <div className='max-w-7xl sm:px-6 lg:px-8 flex items-center justify-between px-4 py-4 mx-auto'>
          <Link
            href='/'
            className='hover:text-blue-800 flex items-center gap-2 text-blue-600 transition-colors'
          >
            <Home size={20} />
            <span className='font-semibold'>홈으로 돌아가기</span>
          </Link>
          <h1 className='text-xl font-bold text-gray-800'>SCRUD 튜토리얼</h1>
        </div>
      </header>

      <main className='max-w-7xl sm:px-6 lg:px-8 px-4 py-8 mx-auto'>
        {/* 진행 상태 표시 */}
        <div className='mb-8'>
          <div className='flex items-center justify-between mb-2'>
            <h2 className='text-sm font-medium text-gray-500'>튜토리얼 진행 상태</h2>
            <span className='text-sm font-medium text-gray-500'>
              {currentStep + 1} / {steps.length}
            </span>
          </div>
          <div className='h-2 overflow-hidden bg-gray-200 rounded-full'>
            <div
              className='h-full transition-all duration-300 ease-in-out bg-blue-500'
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* 단계 내비게이션 */}
        <div className='flex flex-wrap gap-2 mb-8'>
          {steps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => goToStep(index)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                currentStep === index
                  ? 'bg-blue-500 text-white'
                  : index < currentStep
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {index < currentStep && <Check className='inline-block w-4 h-4 mr-1' />}
              {step.title}
            </button>
          ))}
        </div>

        {/* 튜토리얼 내용 */}
        <div className='rounded-xl mb-8 overflow-hidden bg-white shadow-md'>
          <div className='sm:p-8 p-6'>
            {currentStep === 0 && <IntroductionStep />}
            {currentStep === 1 && <ProjectCreationStep />}
            {currentStep === 2 && <ProjectConfigStep />}
            {currentStep === 3 && <ApiCreationStep />}
            {currentStep === 4 && <ApiVisualizationStep />}
            {currentStep === 5 && <CodeGenerationStep />}
            {currentStep === 6 && <ConclusionStep />}
          </div>
        </div>

        {/* 이전/다음 버튼 */}
        <div className='flex justify-between'>
          <button
            onClick={goToPreviousStep}
            disabled={currentStep === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
              currentStep === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-blue-600 hover:bg-blue-50 shadow-sm'
            }`}
          >
            <ChevronLeft size={20} />
            이전 단계
          </button>
          <button
            onClick={goToNextStep}
            disabled={currentStep === steps.length - 1}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
              currentStep === steps.length - 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600 shadow-sm'
            }`}
          >
            다음 단계
            <ChevronRight size={20} />
          </button>
        </div>
      </main>
    </div>
  );
}

// 각 단계별 컴포넌트
function IntroductionStep() {
  return (
    <div>
      <h2 className='mb-4 text-2xl font-bold text-gray-800'>SCRUD 서비스 소개</h2>
      <div className='mb-6'>
        <div className='aspect-video relative mb-4 overflow-hidden bg-gray-100 rounded-lg'>
          <Image
            src='/tutorial/scrud-dashboard-overview.png'
            alt='SCRUD 서비스 대시보드 개요'
            width={800}
            height={400}
            className='object-cover'
          />
        </div>
        <p className='mb-4 text-gray-600'>
          <strong className='text-blue-600'>SCRUD</strong>는 API 설계부터 Spring 코드 생성까지 개발 과정을 간소화하는
          통합 개발 플랫폼입니다. 복잡한 백엔드 개발 과정을 직관적인 인터페이스로 단순화하여 개발자의 생산성을 크게
          향상시킵니다.
        </p>
      </div>

      <h3 className='mb-3 text-xl font-semibold text-gray-800'>주요 기능</h3>
      <div className='md:grid-cols-2 grid gap-4 mb-6'>
        <div className='bg-blue-50 p-4 rounded-lg'>
          <h4 className='mb-2 font-medium text-blue-800'>프로젝트 관리</h4>
          <p className='text-gray-600'>
            다양한 프로젝트를 생성하고 관리할 수 있으며, 각 프로젝트의 요구사항과 설정을 직관적으로 정의할 수 있습니다.
          </p>
        </div>
        <div className='bg-blue-50 p-4 rounded-lg'>
          <h4 className='mb-2 font-medium text-blue-800'>API 설계</h4>
          <p className='text-gray-600'>
            RESTful API를 쉽게 설계하고 엔드포인트, 요청/응답 구조, 파라미터 등을 정의할 수 있습니다.
          </p>
        </div>
        <div className='bg-blue-50 p-4 rounded-lg'>
          <h4 className='mb-2 font-medium text-blue-800'>시각적 도식화</h4>
          <p className='text-gray-600'>
            API의 구조와 흐름을 시각적으로 확인하여 복잡한 관계를 쉽게 이해하고 설계할 수 있습니다.
          </p>
        </div>
        <div className='bg-blue-50 p-4 rounded-lg'>
          <h4 className='mb-2 font-medium text-blue-800'>코드 자동 생성</h4>
          <p className='text-gray-600'>
            설계된 API를 기반으로 Spring 프레임워크 코드를 자동으로 생성하여 개발 시간을 단축합니다.
          </p>
        </div>
      </div>

      <h3 className='mb-3 text-xl font-semibold text-gray-800'>이 튜토리얼에서 배울 내용</h3>
      <ul className='pl-5 space-y-2 text-gray-600 list-disc'>
        <li>새로운 프로젝트 생성 및 기본 설정 방법</li>
        <li>API 엔드포인트 정의 및 설계 방법</li>
        <li>API 구조 시각화 및 분석 방법</li>
        <li>Spring 코드 자동 생성 및 활용 방법</li>
        <li>생성된 코드의 커스터마이징 및 확장 방법</li>
      </ul>
    </div>
  );
}

function ProjectCreationStep() {
  const projectImages = [
    {
      src: '/tutorial/scrud-dashboard-new-project.png',
      alt: 'SCRUD 대시보드에서 새 프로젝트 생성하기',
      caption: '대시보드에서 새 프로젝트 생성 버튼을 클릭하여 시작합니다.',
    },
    {
      src: '/tutorial/scrud-project-create.png',
      alt: '프로젝트 생성 폼',
      caption: '프로젝트 이름, 설명, 서버 URL 등 기본 정보를 입력합니다.',
    },
  ];

  return (
    <div>
      <h2 className='mb-4 text-2xl font-bold text-gray-800'>프로젝트 생성하기</h2>

      <div className='mb-6'>
        <ImageSlider images={projectImages} />
        <p className='mt-4 text-gray-600'>
          SCRUD에서 새 프로젝트를 생성하는 것은 간단합니다. 대시보드에서 몇 가지 기본 정보만 입력하면 바로 API 설계를
          시작할 수 있습니다.
        </p>
      </div>

      <h3 className='mb-3 text-xl font-semibold text-gray-800'>프로젝트 생성 단계</h3>

      <div className='mb-6 space-y-6'>
        <div className='pl-4 border-l-4 border-blue-500'>
          <h4 className='mb-2 font-medium text-gray-800'>1. 대시보드 접속</h4>
          <p className='text-gray-600'>
            SCRUD 서비스에 로그인한 후, 메인 대시보드 화면으로 이동합니다. 대시보드에서는 기존 프로젝트 목록과 새
            프로젝트 생성 버튼을 확인할 수 있습니다.
          </p>
        </div>

        <div className='pl-4 border-l-4 border-blue-500'>
          <h4 className='mb-2 font-medium text-gray-800'>2. 새 프로젝트 버튼 클릭</h4>
          <p className='text-gray-600'>
            대시보드에서 &quot;새 프로젝트 만들기&quot; 버튼을 클릭합니다. 이 버튼은 일반적으로 프로젝트 카드 목록의 첫
            번째 항목으로 표시됩니다.
          </p>
          <div className='bg-gray-50 p-3 mt-3 rounded-md'>
            <code className='text-sm text-gray-800'>프로젝트 카드 목록 → &quot;새 프로젝트 만들기&quot; 버튼 클릭</code>
          </div>
        </div>

        <div className='pl-4 border-l-4 border-blue-500'>
          <h4 className='mb-2 font-medium text-gray-800'>3. 프로젝트 기본 정보 입력</h4>
          <p className='text-gray-600'>프로젝트 생성 페이지에서 다음과 같은 기본 정보를 입력합니다:</p>
          <ul className='pl-5 mt-2 space-y-1 text-gray-600 list-disc'>
            <li>
              <strong>프로젝트명</strong>: 프로젝트의 이름 (필수)
            </li>
            <li>
              <strong>프로젝트 설명</strong>: 프로젝트에 대한 간략한 설명 (필수)
            </li>
            <li>
              <strong>Server URL</strong>: API 서버의 기본 URL (필수)
            </li>
          </ul>
        </div>
      </div>

      <div className='bg-yellow-50 p-4 mb-6 border-l-4 border-yellow-400 rounded-md'>
        <h4 className='mb-1 font-medium text-yellow-800'>프로젝트 이름 작성 팁</h4>
        <p className='text-gray-600'>
          프로젝트 이름은 나중에 코드 생성 시 패키지 이름이나 클래스 접두사로 활용될 수 있으므로, 간결하고 의미 있는
          이름을 사용하는 것이 좋습니다. 특수 문자나 공백은 피하고 카멜케이스나 케밥케이스를 사용하는 것을 권장합니다.
        </p>
      </div>

      <h3 className='mb-3 text-xl font-semibold text-gray-800'>프로젝트 생성 후 다음 단계</h3>
      <p className='text-gray-600'>
        기본 정보를 입력하고 프로젝트를 생성하면, 자동으로 프로젝트 설정 페이지로 이동합니다. 이 페이지에서 더 상세한
        프로젝트 설정을 진행할 수 있습니다. 다음 단계에서는 이러한 상세 설정 방법에 대해 알아보겠습니다.
      </p>
    </div>
  );
}

function ProjectConfigStep() {
  return (
    <div>
      <h2 className='mb-4 text-2xl font-bold text-gray-800'>프로젝트 설정하기</h2>

      <div className='mb-6'>
        <div className='aspect-video relative mb-4 overflow-hidden bg-gray-100 rounded-lg'>
          <Image
            src='/tutorial/scrud-project-config.png'
            alt='프로젝트 설정 화면'
            width={800}
            height={400}
            className='object-cover'
          />
        </div>
        <p className='mb-4 text-gray-600'>
          프로젝트 설정 단계에서는 API 생성의 기반이 되는 요구사항과 기술적 설정을 정의합니다. 이 단계에서 입력한 정보는
          SCRUD가 최적의 API 구조와 코드를 생성하는 데 활용됩니다.
        </p>
      </div>

      <h3 className='mb-3 text-xl font-semibold text-gray-800'>필수 설정 항목</h3>

      <div className='mb-6 space-y-6'>
        <div className='pl-4 border-l-4 border-blue-500'>
          <h4 className='mb-2 font-medium text-gray-800'>1. 요구사항 명세서</h4>
          <p className='text-gray-600'>
            프로젝트의 기능적 요구사항을 정의하는 문서를 업로드하거나 직접 작성합니다. 이 정보는 API 엔드포인트 구조와
            기능을 결정하는 데 중요한 역할을 합니다.
          </p>
          <div className='bg-gray-50 p-3 mt-3 rounded-md'>
            <code className='text-sm text-gray-800'>파일 업로드 또는 텍스트 입력 → 요구사항 명세 정의</code>
          </div>
        </div>

        <div className='pl-4 border-l-4 border-blue-500'>
          <h4 className='mb-2 font-medium text-gray-800'>2. ERD (Entity Relationship Diagram)</h4>
          <p className='text-gray-600'>
            데이터베이스 구조를 정의하는 ERD를 업로드합니다. 이 정보는 API의 데이터 모델과 엔티티 관계를 결정하는 데
            사용됩니다.
          </p>
          <div className='bg-gray-50 p-3 mt-3 rounded-md'>
            <code className='text-sm text-gray-800'>ERD 파일 업로드 → 데이터 모델 및 관계 정의</code>
          </div>
        </div>
      </div>

      <h3 className='mb-3 text-xl font-semibold text-gray-800'>선택적 설정 항목</h3>

      <div className='md:grid-cols-2 grid gap-4 mb-6'>
        <div className='bg-gray-50 p-4 rounded-lg'>
          <h4 className='mb-2 font-medium text-gray-800'>의존성 파일</h4>
          <p className='text-sm text-gray-600'>
            프로젝트에서 사용할 라이브러리와 의존성을 정의합니다. Spring 프로젝트의 경우 build.gradle 또는 pom.xml
            파일을 업로드할 수 있습니다.
          </p>
        </div>
        <div className='bg-gray-50 p-4 rounded-lg'>
          <h4 className='mb-2 font-medium text-gray-800'>유틸 클래스</h4>
          <p className='text-sm text-gray-600'>
            프로젝트에서 공통으로 사용할 유틸리티 클래스를 정의합니다. 날짜 처리, 문자열 변환 등의 유틸리티 함수를
            포함할 수 있습니다.
          </p>
        </div>
        <div className='bg-gray-50 p-4 rounded-lg'>
          <h4 className='mb-2 font-medium text-gray-800'>에러 코드</h4>
          <p className='text-sm text-gray-600'>
            API에서 사용할 에러 코드와 메시지를 정의합니다. 일관된 에러 처리를 위한 코드 체계를 설정할 수 있습니다.
          </p>
        </div>
        <div className='bg-gray-50 p-4 rounded-lg'>
          <h4 className='mb-2 font-medium text-gray-800'>보안 설정</h4>
          <p className='text-sm text-gray-600'>
            API의 인증 및 권한 부여 방식을 설정합니다. JWT, OAuth 등 다양한 인증 방식을 선택할 수 있습니다.
          </p>
        </div>
        <div className='bg-gray-50 p-4 rounded-lg'>
          <h4 className='mb-2 font-medium text-gray-800'>코드 컨벤션</h4>
          <p className='text-sm text-gray-600'>
            생성될 코드의 스타일과 규칙을 정의합니다. 네이밍 규칙, 들여쓰기 스타일 등을 설정할 수 있습니다.
          </p>
        </div>
        <div className='bg-gray-50 p-4 rounded-lg'>
          <h4 className='mb-2 font-medium text-gray-800'>아키텍처 구조</h4>
          <p className='text-sm text-gray-600'>
            프로젝트의 아키텍처 패턴을 선택합니다. 레이어드 아키텍처, 헥사고날 아키텍처 등 다양한 옵션이 제공됩니다.
          </p>
        </div>
      </div>

      <div className='bg-green-50 p-4 mb-6 border-l-4 border-green-400 rounded-md'>
        <h4 className='mb-1 font-medium text-green-800'>설정 완료 후 다음 단계</h4>
        <p className='text-gray-600'>
          모든 필수 설정을 완료하면 화면 하단의 &quot;완료&quot; 버튼이 활성화됩니다. 이 버튼을 클릭하면 프로젝트 설정이
          저장되고, API 생성 단계로 자동으로 이동합니다.
        </p>
      </div>

      <h3 className='mb-3 text-xl font-semibold text-gray-800'>설정의 중요성</h3>
      <p className='text-gray-600'>
        프로젝트 설정은 SCRUD가 생성하는 API의 품질과 구조에 직접적인 영향을 미칩니다. 특히 요구사항 명세서와 ERD는 API
        엔드포인트와 데이터 모델의 기반이 되므로, 가능한 상세하고 정확하게 작성하는 것이 중요합니다. 설정은 언제든지
        수정할 수 있지만, 초기에 정확한 설정을 제공할수록 더 효율적인 API 설계가 가능합니다.
      </p>
    </div>
  );
}

function ApiCreationStep() {
  const apiCreationImages = [
    {
      src: '/tutorial/scrud-api-creation.png',
      alt: 'API 생성 인터페이스',
      caption: 'API 생성 화면에서 엔드포인트를 정의합니다.',
    },
    {
      src: '/tutorial/scrud-api-creation2.png',
      alt: 'API 상세 설정',
      caption: 'API 요청 및 응답 구조를 상세하게 정의합니다.',
    },
  ];

  return (
    <div>
      <h2 className='mb-4 text-2xl font-bold text-gray-800'>API 생성하기</h2>

      <div className='mb-6'>
        <ImageSlider images={apiCreationImages} />
        <p className='mt-4 text-gray-600'>
          프로젝트 설정을 완료하면 API 생성 단계로 이동합니다. 이 단계에서는 RESTful API 엔드포인트를 정의하고, 각
          엔드포인트의 요청/응답 구조, 파라미터, 인증 요구사항 등을 설정합니다.
        </p>
      </div>

      <h3 className='mb-3 text-xl font-semibold text-gray-800'>API 생성 인터페이스 이해하기</h3>

      <div className='md:grid-cols-3 grid gap-4 mb-6'>
        <div className='bg-gray-50 col-span-1 p-4 rounded-lg'>
          <h4 className='mb-2 font-medium text-gray-800'>좌측 패널</h4>
          <p className='text-sm text-gray-600'>
            프로젝트 설정 정보와 글로벌 파일을 확인할 수 있습니다. 이 정보는 API 설계 시 참조용으로 활용됩니다.
          </p>
        </div>
        <div className='bg-gray-50 col-span-1 p-4 rounded-lg'>
          <h4 className='mb-2 font-medium text-gray-800'>중앙 패널</h4>
          <p className='text-sm text-gray-600'>
            API 엔드포인트 목록을 표시하고 관리합니다. 새 API를 추가하거나 기존 API를 선택할 수 있습니다.
          </p>
        </div>
        <div className='bg-gray-50 col-span-1 p-4 rounded-lg'>
          <h4 className='mb-2 font-medium text-gray-800'>우측 패널</h4>
          <p className='text-sm text-gray-600'>
            선택한 API의 상세 설정을 편집합니다. 요청/응답 구조, 파라미터, 인증 등을 정의합니다.
          </p>
        </div>
      </div>

      <h3 className='mb-3 text-xl font-semibold text-gray-800'>API 생성 단계</h3>

      <div className='mb-6 space-y-6'>
        <div className='pl-4 border-l-4 border-blue-500'>
          <h4 className='mb-2 font-medium text-gray-800'>1. 새 API 엔드포인트 추가</h4>
          <p className='text-gray-600'>
            중앙 패널 상단의 &quot;새 API 추가&quot; 버튼을 클릭하여 새로운 API 엔드포인트를 생성합니다.
          </p>
          <div className='bg-gray-50 p-3 mt-3 rounded-md'>
            <code className='text-sm text-gray-800'>중앙 패널 → &quot;새 API 추가&quot; 버튼 → API 기본 정보 입력</code>
          </div>
        </div>

        <div className='pl-4 border-l-4 border-blue-500'>
          <h4 className='mb-2 font-medium text-gray-800'>2. API 기본 정보 설정</h4>
          <p className='text-gray-600'>다음과 같은 API 기본 정보를 입력합니다:</p>
          <ul className='pl-5 mt-2 space-y-1 text-gray-600 list-disc'>
            <li>
              <strong>경로(Path)</strong>: API 엔드포인트 경로 (예: /api/v1/users)
            </li>
            <li>
              <strong>HTTP 메서드</strong>: GET, POST, PUT, DELETE 등
            </li>
            <li>
              <strong>설명</strong>: API의 용도와 기능에 대한 설명
            </li>
          </ul>
        </div>

        <div className='pl-4 border-l-4 border-blue-500'>
          <h4 className='mb-2 font-medium text-gray-800'>3. 요청 파라미터 정의</h4>
          <p className='text-gray-600'>API 요청에 필요한 파라미터를 정의합니다:</p>
          <ul className='pl-5 mt-2 space-y-1 text-gray-600 list-disc'>
            <li>
              <strong>경로 파라미터</strong>: URL 경로에 포함되는 변수 (예: /users/{'{id}'})
            </li>
            <li>
              <strong>쿼리 파라미터</strong>: URL 쿼리 스트링으로 전달되는 파라미터
            </li>
            <li>
              <strong>요청 본문(Body)</strong>: POST/PUT 요청의 JSON 구조
            </li>
          </ul>
        </div>

        <div className='pl-4 border-l-4 border-blue-500'>
          <h4 className='mb-2 font-medium text-gray-800'>4. 응답 구조 정의</h4>
          <p className='text-gray-600'>API 응답의 구조와 형식을 정의합니다:</p>
          <ul className='pl-5 mt-2 space-y-1 text-gray-600 list-disc'>
            <li>
              <strong>성공 응답</strong>: 200, 201 등 성공 상태 코드의 응답 구조
            </li>
            <li>
              <strong>오류 응답</strong>: 400, 404, 500 등 오류 상태 코드의 응답 구조
            </li>
            <li>
              <strong>응답 헤더</strong>: 필요한 경우 커스텀 응답 헤더 정의
            </li>
          </ul>
        </div>
      </div>

      <div className='bg-yellow-50 p-4 mb-6 border-l-4 border-yellow-400 rounded-md'>
        <h4 className='mb-1 font-medium text-yellow-800'>API 설계 모범 사례</h4>
        <p className='text-gray-600'>RESTful API 설계 시 다음 사항을 고려하세요:</p>
        <ul className='pl-5 mt-2 space-y-1 text-gray-600 list-disc'>
          <li>일관된 명명 규칙 사용 (복수형 명사 권장: /users, /products)</li>
          <li>적절한 HTTP 메서드 사용 (GET: 조회, POST: 생성, PUT: 전체 수정, PATCH: 부분 수정, DELETE: 삭제)</li>
          <li>명확한 버전 관리 (/api/v1/...)</li>
          <li>적절한 상태 코드 사용 (200: 성공, 201: 생성됨, 400: 잘못된 요청, 404: 찾을 수 없음 등)</li>
        </ul>
      </div>

      <h3 className='mb-3 text-xl font-semibold text-gray-800'>API 생성 완료</h3>
      <p className='text-gray-600'>
        모든 API 엔드포인트를 정의한 후, 각 API의 상세 설정을 완료하면 &quot;저장&quot; 버튼을 클릭하여 API 설계를
        저장합니다. 저장된 API는 다음 단계인 API 도식화 단계에서 시각적으로 확인하고 분석할 수 있습니다.
      </p>
    </div>
  );
}

function ApiVisualizationStep() {
  const visualizationImages = [
    {
      src: '/tutorial/scrud-api-visualization.png',
      alt: 'API 도식화 다이어그램',
      caption: 'API 클래스 구조와 관계를 시각적으로 확인합니다.',
    },
    {
      src: '/tutorial/scrud-api-visualization2.png',
      alt: 'API 도식화 상세 뷰',
      caption: 'API 메서드와 속성을 상세하게 분석할 수 있습니다.',
    },
  ];

  return (
    <div>
      <h2 className='mb-4 text-2xl font-bold text-gray-800'>API 도식화 확인하기</h2>

      <div className='mb-6'>
        <ImageSlider images={visualizationImages} />
        <p className='mt-4 text-gray-600'>
          API 생성이 완료되면, SCRUD는 정의된 API를 기반으로 클래스 다이어그램과 흐름도를 자동으로 생성합니다. 이 시각화
          도구를 통해 API의 구조와 관계를 직관적으로 확인하고 분석할 수 있습니다.
        </p>
      </div>

      <h3 className='mb-3 text-xl font-semibold text-gray-800'>도식화 인터페이스 이해하기</h3>

      <div className='md:grid-cols-2 grid gap-4 mb-6'>
        <div className='bg-gray-50 p-4 rounded-lg'>
          <h4 className='mb-2 font-medium text-gray-800'>좌측 패널 - 채팅 인터페이스</h4>
          <p className='text-sm text-gray-600'>
            AI 어시스턴트와 대화하며 API 설계에 대한 질문을 하거나 수정 사항을 요청할 수 있습니다. AI는 다이어그램을
            분석하고 개선 사항을 제안합니다.
          </p>
        </div>
        <div className='bg-gray-50 p-4 rounded-lg'>
          <h4 className='mb-2 font-medium text-gray-800'>우측 패널 - 다이어그램 뷰</h4>
          <p className='text-sm text-gray-600'>
            API의 클래스 구조, 메서드, 관계 등을 시각적으로 표현한 다이어그램을 확인할 수 있습니다. 다이어그램은
            인터랙티브하게 조작 가능합니다.
          </p>
        </div>
      </div>

      <h3 className='mb-3 text-xl font-semibold text-gray-800'>도식화 활용 방법</h3>

      <div className='mb-6 space-y-6'>
        <div className='pl-4 border-l-4 border-blue-500'>
          <h4 className='mb-2 font-medium text-gray-800'>1. 클래스 구조 확인</h4>
          <p className='text-gray-600'>
            다이어그램에서 컨트롤러, 서비스, 레포지토리, 엔티티 등 주요 클래스의 구조와 관계를 확인합니다. 각 클래스는
            색상으로 구분되어 표시됩니다.
          </p>
        </div>

        <div className='pl-4 border-l-4 border-blue-500'>
          <h4 className='mb-2 font-medium text-gray-800'>2. 메서드 상세 정보 확인</h4>
          <p className='text-gray-600'>
            클래스 내의 메서드를 클릭하면 해당 메서드의 상세 정보(파라미터, 반환 타입, 구현 코드 등)를 확인할 수
            있습니다.
          </p>
          <div className='bg-gray-50 p-3 mt-3 rounded-md'>
            <code className='text-sm text-gray-800'>메서드 노드 클릭 → 메서드 상세 정보 표시 → 코드 미리보기</code>
          </div>
        </div>

        <div className='pl-4 border-l-4 border-blue-500'>
          <h4 className='mb-2 font-medium text-gray-800'>3. 관계 분석</h4>
          <p className='text-gray-600'>
            클래스 간의 관계(상속, 구현, 의존성 등)를 선으로 표시하여 API의 구조적 흐름을 파악할 수 있습니다. 관계선의
            유형과 방향을 통해 의존성 구조를 분석할 수 있습니다.
          </p>
        </div>

        <div className='pl-4 border-l-4 border-blue-500'>
          <h4 className='mb-2 font-medium text-gray-800'>4. AI 어시스턴트와 대화</h4>
          <p className='text-gray-600'>좌측 채팅 패널에서 AI 어시스턴트에게 다음과 같은 질문을 할 수 있습니다:</p>
          <ul className='pl-5 mt-2 space-y-1 text-gray-600 list-disc'>
            <li>&quot;이 API의 주요 기능은 무엇인가요?&quot;</li>
            <li>&quot;이 클래스 구조의 개선점은 무엇인가요?&quot;</li>
            <li>&quot;이 메서드의 역할과 구현 방식을 설명해주세요.&quot;</li>
            <li>&quot;이 API의 보안 취약점이 있을까요?&quot;</li>
          </ul>
        </div>
      </div>

      <div className='bg-green-50 p-4 mb-6 border-l-4 border-green-400 rounded-md'>
        <h4 className='mb-1 font-medium text-green-800'>다이어그램 조작 팁</h4>
        <ul className='pl-5 mt-2 space-y-1 text-gray-600 list-disc'>
          <li>
            <strong>확대/축소</strong>: 마우스 휠 또는 확대/축소 버튼 사용
          </li>
          <li>
            <strong>이동</strong>: 다이어그램 영역을 클릭한 상태로 드래그
          </li>
          <li>
            <strong>노드 이동</strong>: 클래스 또는 메서드 노드를 드래그하여 위치 조정
          </li>
          <li>
            <strong>노드 선택</strong>: 노드를 클릭하여 상세 정보 확인 및 툴바 표시
          </li>
          <li>
            <strong>미니맵</strong>: 우측 하단의 미니맵을 통해 전체 구조 파악 및 빠른 이동
          </li>
        </ul>
      </div>

      <h3 className='mb-3 text-xl font-semibold text-gray-800'>도식화를 통한 API 개선</h3>
      <p className='mb-4 text-gray-600'>
        도식화를 통해 API 구조의 문제점이나 개선 사항을 발견할 수 있습니다. 예를 들어:
      </p>
      <ul className='pl-5 mb-4 space-y-1 text-gray-600 list-disc'>
        <li>과도하게 복잡한 의존성 관계</li>
        <li>중복된 기능을 가진 메서드</li>
        <li>비효율적인 클래스 구조</li>
        <li>누락된 예외 처리</li>
      </ul>
      <p className='text-gray-600'>
        이러한 문제점을 발견하면 AI 어시스턴트에게 개선 방안을 문의하거나, 이전 단계로 돌아가 API 설계를 수정할 수
        있습니다. 도식화 단계에서의 분석과 개선은 최종 코드의 품질을 크게 향상시킵니다.
      </p>
    </div>
  );
}

function CodeGenerationStep() {
  const codeGenImages = [
    {
      src: '/tutorial/scrud-spring-code-generation.png',
      alt: 'Spring 코드 생성 결과',
      caption: '생성된 Spring 코드 파일 목록',
    },
    {
      src: '/tutorial/scrud-spring-code-generation2.png',
      alt: '컨트롤러 코드 생성',
      caption: '자동 생성된 컨트롤러 클래스 코드',
    },
    {
      src: '/tutorial/scrud-spring-code-generation3.png',
      alt: '서비스 코드 생성',
      caption: '자동 생성된 서비스 클래스 코드',
    },
    {
      src: '/tutorial/scrud-spring-code-generation4.png',
      alt: '엔티티 코드 생성',
      caption: '자동 생성된 엔티티 클래스 코드',
    },
  ];

  return (
    <div>
      <h2 className='mb-4 text-2xl font-bold text-gray-800'>Spring 코드 생성하기</h2>

      <div className='mb-6'>
        <ImageSlider images={codeGenImages} />
        <p className='mt-4 text-gray-600'>
          API 도식화를 완료하고 구조를 확인한 후, SCRUD는 설계된 API를 기반으로 Spring 프레임워크 코드를 자동으로
          생성합니다. 생성된 코드는 즉시 사용 가능한 형태로 제공되며, 필요에 따라 커스터마이징할 수 있습니다.
        </p>
      </div>

      <h3 className='mb-3 text-xl font-semibold text-gray-800'>코드 생성 프로세스</h3>

      <div className='mb-6 space-y-6'>
        <div className='pl-4 border-l-4 border-blue-500'>
          <h4 className='mb-2 font-medium text-gray-800'>1. API 완료 처리</h4>
          <p className='text-gray-600'>
            도식화 화면에서 &quot;API 완료&quot; 버튼을 클릭하여 현재 API의 설계를 확정합니다. 이 단계에서 API 설계가
            최종 검증되고, 코드 생성 준비가 완료됩니다.
          </p>
          <div className='bg-gray-50 p-3 mt-3 rounded-md'>
            <code className='text-sm text-gray-800'>
              도식화 화면 → &quot;API 완료&quot; 버튼 클릭 → 확인 대화상자 → &quot;API 완료&quot; 확인
            </code>
          </div>
        </div>

        <div className='pl-4 border-l-4 border-blue-500'>
          <h4 className='mb-2 font-medium text-gray-800'>2. 코드 생성 진행</h4>
          <p className='text-gray-600'>
            API 완료 처리 후, SCRUD는 자동으로 Spring 코드 생성 프로세스를 시작합니다. 이 과정은 API의 복잡도에 따라 몇
            초에서 몇 분까지 소요될 수 있습니다.
          </p>
        </div>

        <div className='pl-4 border-l-4 border-blue-500'>
          <h4 className='mb-2 font-medium text-gray-800'>3. 생성된 코드 확인</h4>
          <p className='text-gray-600'>
            코드 생성이 완료되면, 생성된 Spring 코드를 확인할 수 있는 화면으로 이동합니다. 여기서 각 파일의 내용을
            검토하고 필요한 경우 수정할 수 있습니다.
          </p>
        </div>
      </div>

      <h3 className='mb-3 text-xl font-semibold text-gray-800'>생성되는 코드 구조</h3>

      <div className='md:grid-cols-2 grid gap-4 mb-6'>
        <div className='bg-gray-50 p-4 rounded-lg'>
          <h4 className='mb-2 font-medium text-gray-800'>Controller 클래스</h4>
          <p className='text-sm text-gray-600'>
            API 엔드포인트를 처리하는 컨트롤러 클래스입니다. 요청 매핑, 파라미터 처리, 응답 생성 등의 로직이 포함됩니다.
          </p>
          <div className='p-2 mt-3 bg-gray-100 rounded-md'>
            <code className='text-xs text-gray-800'>
              @RestController
              <br />
              @RequestMapping(&quot;/api/v1/users&quot;)
              <br />
              public class UserController {'{'}
              <br />
              &nbsp;&nbsp;// API 엔드포인트 메서드들...
              <br />
              {'}'}
            </code>
          </div>
        </div>

        <div className='bg-gray-50 p-4 rounded-lg'>
          <h4 className='mb-2 font-medium text-gray-800'>Service 클래스</h4>
          <p className='text-sm text-gray-600'>
            비즈니스 로직을 처리하는 서비스 클래스입니다. 컨트롤러와 레포지토리 사이의 중간 계층으로 작동합니다.
          </p>
          <div className='p-2 mt-3 bg-gray-100 rounded-md'>
            <code className='text-xs text-gray-800'>
              @Service
              <br />
              public class UserService {'{'}
              <br />
              &nbsp;&nbsp;// 비즈니스 로직 메서드들...
              <br />
              {'}'}
            </code>
          </div>
        </div>

        <div className='bg-gray-50 p-4 rounded-lg'>
          <h4 className='mb-2 font-medium text-gray-800'>Repository 인터페이스</h4>
          <p className='text-sm text-gray-600'>
            데이터 액세스를 담당하는 레포지토리 인터페이스입니다. Spring Data JPA를 활용한 데이터베이스 연동 코드가
            생성됩니다.
          </p>
          <div className='p-2 mt-3 bg-gray-100 rounded-md'>
            <code className='text-xs text-gray-800'>
              @Repository
              <br />
              public interface UserRepository extends JpaRepository&lt;User, Long&gt; {'{'}
              <br />
              &nbsp;&nbsp;// 쿼리 메서드들...
              <br />
              {'}'}
            </code>
          </div>
        </div>

        <div className='bg-gray-50 p-4 rounded-lg'>
          <h4 className='mb-2 font-medium text-gray-800'>Entity 클래스</h4>
          <p className='text-sm text-gray-600'>
            데이터베이스 테이블과 매핑되는 엔티티 클래스입니다. JPA 어노테이션을 활용한 ORM 매핑 코드가 포함됩니다.
          </p>
          <div className='p-2 mt-3 bg-gray-100 rounded-md'>
            <code className='text-xs text-gray-800'>
              @Entity
              <br />
              @Table(name = &quot;users&quot;)
              <br />
              public class User {'{'}
              <br />
              &nbsp;&nbsp;@Id @GeneratedValue(strategy = GenerationType.IDENTITY)
              <br />
              &nbsp;&nbsp;private Long id;
              <br />
              &nbsp;&nbsp;// 필드 및 메서드들...
              <br />
              {'}'}
            </code>
          </div>
        </div>

        <div className='bg-gray-50 p-4 rounded-lg'>
          <h4 className='mb-2 font-medium text-gray-800'>DTO 클래스</h4>
          <p className='text-sm text-gray-600'>
            데이터 전송 객체(DTO) 클래스입니다. API 요청 및 응답 데이터 구조를 정의합니다.
          </p>
          <div className='p-2 mt-3 bg-gray-100 rounded-md'>
            <code className='text-xs text-gray-800'>
              public class UserDto {'{'}
              <br />
              &nbsp;&nbsp;private Long id;
              <br />
              &nbsp;&nbsp;private String username;
              <br />
              &nbsp;&nbsp;// 필드, 생성자, getter/setter 등...
              <br />
              {'}'}
            </code>
          </div>
        </div>

        <div className='bg-gray-50 p-4 rounded-lg'>
          <h4 className='mb-2 font-medium text-gray-800'>Exception 클래스</h4>
          <p className='text-sm text-gray-600'>
            예외 처리를 위한 커스텀 예외 클래스와 글로벌 예외 핸들러입니다. 일관된 오류 응답 형식을 제공합니다.
          </p>
          <div className='p-2 mt-3 bg-gray-100 rounded-md'>
            <code className='text-xs text-gray-800'>
              @RestControllerAdvice
              <br />
              public class GlobalExceptionHandler {'{'}
              <br />
              &nbsp;&nbsp;// 예외 처리 메서드들...
              <br />
              {'}'}
            </code>
          </div>
        </div>
      </div>

      <div className='bg-yellow-50 p-4 mb-6 border-l-4 border-yellow-400 rounded-md'>
        <h4 className='mb-1 font-medium text-yellow-800'>코드 커스터마이징 가능성</h4>
        <p className='text-gray-600'>
          SCRUD가 생성한 코드는 기본적인 구조와 기능을 제공하지만, 필요에 따라 다음과 같은 커스터마이징이 가능합니다:
        </p>
        <ul className='pl-5 mt-2 space-y-1 text-gray-600 list-disc'>
          <li>비즈니스 로직 확장 및 수정</li>
          <li>추가적인 유효성 검사 로직 구현</li>
          <li>보안 기능 강화 (인증, 권한 부여 등)</li>
          <li>성능 최적화 (캐싱, 인덱싱 등)</li>
          <li>테스트 코드 추가</li>
        </ul>
      </div>

      <h3 className='mb-3 text-xl font-semibold text-gray-800'>코드 다운로드 및 활용</h3>
      <p className='mb-4 text-gray-600'>생성된 코드는 다음과 같은 방법으로 다운로드하고 활용할 수 있습니다:</p>
      <ul className='pl-5 mb-4 space-y-1 text-gray-600 list-disc'>
        <li>
          <strong>ZIP 파일 다운로드</strong>: 전체 프로젝트를 ZIP 파일로 다운로드하여 로컬 개발 환경에서 사용
        </li>
        <li>
          <strong>GitHub 연동</strong>: GitHub 저장소에 직접 코드를 푸시하여 버전 관리 및 협업 가능
        </li>
        <li>
          <strong>개별 파일 복사</strong>: 필요한 파일만 선택적으로 복사하여 기존 프로젝트에 통합
        </li>
      </ul>
      <p className='text-gray-600'>
        다운로드한 코드는 Spring Boot 프로젝트로 구성되어 있으며, Maven 또는 Gradle을 통해 의존성을 관리합니다.
        프로젝트를 로컬 개발 환경에서 실행하면 API가 즉시 작동하는 것을 확인할 수 있습니다.
      </p>
    </div>
  );
}

function ConclusionStep() {
  return (
    <div>
      <h2 className='mb-4 text-2xl font-bold text-gray-800'>SCRUD 활용 마무리</h2>

      <div className='mb-6'>
        <div className='aspect-video relative mb-4 overflow-hidden bg-gray-100 rounded-lg'>
          <Image
            src='/tutorial/scrud-completion-summary.png'
            alt='생성된 Spring 코드로 작업하는 개발자'
            width={800}
            height={400}
            className='object-cover'
          />
        </div>
        <p className='mb-4 text-gray-600'>
          지금까지 SCRUD를 활용하여 프로젝트 생성부터 API 설계, 도식화, 그리고 Spring 코드 생성까지의 전체 워크플로우를
          살펴보았습니다. SCRUD는 백엔드 개발 과정을 간소화하고 표준화하여 개발자의 생산성을 크게 향상시킵니다.
        </p>
      </div>

      <h3 className='mb-3 text-xl font-semibold text-gray-800'>SCRUD의 주요 이점</h3>

      <div className='md:grid-cols-3 grid gap-4 mb-6'>
        <div className='bg-blue-50 p-4 rounded-lg'>
          <h4 className='mb-2 font-medium text-blue-800'>개발 시간 단축</h4>
          <p className='text-sm text-gray-600'>
            반복적인 코드 작성 작업을 자동화하여 개발 시간을 크게 단축합니다. 기본적인 CRUD 작업과 표준 패턴의 코드를
            빠르게 생성할 수 있습니다.
          </p>
        </div>
        <div className='bg-blue-50 p-4 rounded-lg'>
          <h4 className='mb-2 font-medium text-blue-800'>코드 품질 향상</h4>
          <p className='text-sm text-gray-600'>
            모범 사례와 디자인 패턴을 적용한 고품질 코드를 생성합니다. 일관된 코드 스타일과 구조를 유지하여 유지보수성을
            높입니다.
          </p>
        </div>
        <div className='bg-blue-50 p-4 rounded-lg'>
          <h4 className='mb-2 font-medium text-blue-800'>시각적 설계</h4>
          <p className='text-sm text-gray-600'>
            API 구조를 시각적으로 설계하고 분석할 수 있어 복잡한 관계를 쉽게 이해하고 설계 오류를 조기에 발견할 수
            있습니다.
          </p>
        </div>
        <div className='bg-blue-50 p-4 rounded-lg'>
          <h4 className='mb-2 font-medium text-blue-800'>팀 협업 강화</h4>
          <p className='text-sm text-gray-600'>
            표준화된 API 설계와 문서화를 통해 팀 내 협업을 강화합니다. 프론트엔드와 백엔드 개발자 간의 소통을 원활하게
            합니다.
          </p>
        </div>
        <div className='bg-blue-50 p-4 rounded-lg'>
          <h4 className='mb-2 font-medium text-blue-800'>학습 도구</h4>
          <p className='text-sm text-gray-600'>
            Spring 프레임워크와 RESTful API 설계에 대한 학습 도구로 활용할 수 있습니다. 생성된 코드를 분석하며 모범
            사례를 배울 수 있습니다.
          </p>
        </div>
        <div className='bg-blue-50 p-4 rounded-lg'>
          <h4 className='mb-2 font-medium text-blue-800'>확장성</h4>
          <p className='text-sm text-gray-600'>
            생성된 코드를 기반으로 추가 기능을 쉽게 확장할 수 있습니다. 견고한 기본 구조 위에 비즈니스 로직을 추가하여
            개발을 가속화합니다.
          </p>
        </div>
      </div>

      <h3 className='mb-3 text-xl font-semibold text-gray-800'>다음 단계</h3>

      <div className='mb-6 space-y-6'>
        <div className='pl-4 border-l-4 border-blue-500'>
          <h4 className='mb-2 font-medium text-gray-800'>1. 생성된 코드 커스터마이징</h4>
          <p className='text-gray-600'>
            SCRUD가 생성한 기본 코드를 기반으로 비즈니스 요구사항에 맞게 코드를 확장하고 커스터마이징합니다. 특히 서비스
            레이어의 비즈니스 로직을 구체화하고, 추가적인 유효성 검사 및 예외 처리를 구현합니다.
          </p>
        </div>

        <div className='pl-4 border-l-4 border-blue-500'>
          <h4 className='mb-2 font-medium text-gray-800'>2. 테스트 코드 작성</h4>
          <p className='text-gray-600'>
            생성된 API에 대한 단위 테스트와 통합 테스트를 작성하여 코드의 품질과 안정성을 보장합니다. JUnit, Mockito
            등의 테스트 프레임워크를 활용하여 테스트 자동화를 구현합니다.
          </p>
        </div>

        <div className='pl-4 border-l-4 border-blue-500'>
          <h4 className='mb-2 font-medium text-gray-800'>3. 프론트엔드 연동</h4>
          <p className='text-gray-600'>
            생성된 백엔드 API와 프론트엔드 애플리케이션을 연동하여 완전한 웹 애플리케이션을 구축합니다. API 문서를
            참조하여 클라이언트 측 코드를 개발합니다.
          </p>
        </div>

        <div className='pl-4 border-l-4 border-blue-500'>
          <h4 className='mb-2 font-medium text-gray-800'>4. 배포 및 운영</h4>
          <p className='text-gray-600'>
            개발된 애플리케이션을 클라우드 환경이나 온프레미스 서버에 배포하고 운영합니다. CI/CD 파이프라인을 구축하여
            지속적인 통합과 배포를 자동화합니다.
          </p>
        </div>
      </div>

      <div className='bg-green-50 p-4 mb-6 border-l-4 border-green-400 rounded-md'>
        <h4 className='mb-1 font-medium text-green-800'>SCRUD 활용 모범 사례</h4>
        <p className='text-gray-600'>SCRUD를 최대한 활용하기 위한 몇 가지 모범 사례를 소개합니다:</p>
        <ul className='pl-5 mt-2 space-y-1 text-gray-600 list-disc'>
          <li>프로젝트 초기 단계에서 요구사항과 ERD를 상세하게 정의하여 정확한 API 설계 유도</li>
          <li>생성된 코드를 그대로 사용하기보다 비즈니스 요구사항에 맞게 적절히 커스터마이징</li>
          <li>API 도식화 단계에서 AI 어시스턴트와 적극적으로 대화하여 설계 개선점 발견</li>
          <li>여러 버전의 API 설계를 비교하며 최적의 구조 탐색</li>
          <li>팀원들과 SCRUD 프로젝트를 공유하여 협업 효율성 향상</li>
        </ul>
      </div>

      <h3 className='mb-3 text-xl font-semibold text-gray-800'>마무리</h3>
      <p className='mb-4 text-gray-600'>
        SCRUD는 API 설계와 Spring 코드 생성을 간소화하는 강력한 도구입니다. 이 튜토리얼을 통해 SCRUD의 기본적인 사용법과
        워크플로우를 익혔습니다. 이제 실제 프로젝트에 SCRUD를 적용하여 개발 생산성을 향상시키고, 고품질의 API를 빠르게
        구축해보세요.
      </p>
      <p className='text-gray-600'>
        추가적인 질문이나 도움이 필요하시면 언제든지 SCRUD 지원팀에 문의하거나, 피드백 게시판을 참조하시기 바랍니다.
        행복한 코딩 되세요!
      </p>
    </div>
  );
}
