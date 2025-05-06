import ApiCreator from "@/components/api-creator/ApiCreator"

export default function ApiPage() {
  return (
    <main className="p-0">
      <div className="border-b border-gray-200 py-4">
        <div className="max-w-full mx-auto px-6">
          <div className="relative flex items-center justify-between max-w-3xl mx-auto">
            {/* 단계 선 (배경) */}
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -translate-y-1/2"></div>

            {/* 진행 바 */}
            <div className="absolute top-1/2 left-0 w-1/2 h-1 bg-blue-500 -translate-y-1/2"></div>

            {/* 단계 1 */}
            <div className="relative flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white mb-1 text-sm font-medium z-10">1</div>
              <span className="text-xs font-medium text-blue-500 whitespace-nowrap">전역 설정</span>
            </div>

            {/* 단계 2 */}
            <div className="relative flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white mb-1 text-sm font-medium z-10">2</div>
              <span className="text-xs font-medium text-blue-500 whitespace-nowrap">API 제작</span>
            </div>

            {/* 단계 3 */}
            <div className="relative flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 mb-1 text-sm font-medium z-10">3</div>
              <span className="text-xs font-medium text-gray-500 whitespace-nowrap">API 도식화</span>
            </div>
          </div>
        </div>
      </div>
      <ApiCreator />
    </main>
  )
}
