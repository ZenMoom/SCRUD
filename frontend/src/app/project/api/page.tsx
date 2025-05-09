import ApiCreator from "@/components/api-creator/ApiCreator"

export default function ApiPage() {
  return (
    <main className="p-0">
      <div className=" py-6 bg-gradient-to-r white">
        <div className="max-w-full mx-auto px-6">
          <div className="relative flex items-center justify-between max-w-3xl mx-auto">
            {/* 단계 선 (배경) - 모든 원 아래로 지나감 */}
            <div className="absolute top-1/2 left-0 right-0 h-1.5 bg-gray-100 -translate-y-1/2 rounded-full"></div>

            {/* 진행 바 - 모든 원 아래로 지나감 */}
            <div className="absolute top-1/2 left-0 w-1/2 h-1.5 bg-gradient-to-r from-blue-400 to-indigo-500 -translate-y-1/2 rounded-full shadow-sm"></div>

            {/* 단계 1 - 완료 */}
            <div className="relative flex flex-col items-center group">
              <div className="w-10 h-15 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white mb-2 text-sm font-medium z-10 shadow-md transform transition-transform duration-300 group-hover:scale-110">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-800 whitespace-nowrap transition-colors group-hover:text-indigo-600">전역 설정</span>
            </div>

            {/* 단계 2 - 현재 */}
            <div className="relative flex flex-col items-center group">
              <div className="w-10 h-15 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white mb-2 text-sm font-medium z-10 shadow-md transform transition-transform duration-300 group-hover:scale-110">
                <span>2</span>
              </div>
              <span className="text-sm font-medium text-gray-800 whitespace-nowrap transition-colors group-hover:text-indigo-600">API 제작</span>
            </div>

            {/* 단계 3 - 미완료 */}
            <div className="relative flex flex-col items-center group">
              <div className="w-10 h-15 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center text-gray-400 mb-2 text-sm font-medium z-10 shadow-sm transform transition-transform duration-300 group-hover:scale-110 group-hover:border-gray-300">
                <span>3</span>
              </div>
              <span className="text-sm font-medium text-gray-400 whitespace-nowrap transition-colors group-hover:text-gray-600">API 도식화</span>
            </div>
          </div>
        </div>
      </div>
      <ApiCreator />
    </main>
  )
}
