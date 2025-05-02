// app/project/api/page.tsx
import ApiCreator from "@/components/api-creator/ApiCreator"

export default function ApiPage() {
  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold mb-6">SCRUD</h1>
      <div className="mb-6">
        <div className="flex items-center mb-4">
          <div className="w-1/3 text-center relative">
            <div className="w-full absolute top-1/2 h-1 bg-gray-300 -z-10"></div>
            <span className="bg-gray-200 text-gray-700 px-4 py-2 rounded-full">전역 설정</span>
          </div>
          <div className="w-1/3 text-center relative">
            <div className="w-full absolute top-1/2 h-1 bg-gray-300 -z-10"></div>
            <span className="bg-blue-500 text-white px-4 py-2 rounded-full">API 제작</span>
          </div>
          <div className="w-1/3 text-center relative">
            <div className="absolute top-1/2 h-1 bg-gray-300 -z-10 w-full"></div>
            <span className="bg-gray-200 text-gray-700 px-4 py-2 rounded-full">API 도식화</span>
          </div>
        </div>
      </div>
      <ApiCreator />
    </main>
  )
}
