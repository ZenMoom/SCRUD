import React from "react"

interface ApiHeaderProps {
  scrudProjectId: number
  apiSpecVersionId: number | null
  isLoading: boolean
  handleSaveApi: () => Promise<void>
  handleDeleteApi: () => Promise<void>
  handleTestApi: () => Promise<void>
}

const ApiHeader: React.FC<ApiHeaderProps> = ({ scrudProjectId, apiSpecVersionId, isLoading, handleSaveApi, handleDeleteApi, handleTestApi }) => {
  return (
    <div className="p-3 border-b bg-white">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <h2 className="text-lg font-semibold mr-4">API 편집기</h2>
          {/* 프로젝트 ID 표시 - 편집 불가능한 형태로 */}
          <div className="px-3 py-1 bg-gray-100 rounded-md text-sm">
            <span className="text-gray-500">프로젝트 ID:</span> <span className="font-medium text-gray-800">{scrudProjectId}</span>
          </div>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={handleSaveApi}
            disabled={isLoading}
            className={`px-3 py-1.5 rounded text-white text-sm font-medium disabled:opacity-50 flex items-center ${
              apiSpecVersionId ? "bg-yellow-500 hover:bg-yellow-600" : "bg-blue-500 hover:bg-blue-600"
            }`}
          >
            {isLoading ? (
              <span className="mr-2 h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                {apiSpecVersionId ? (
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                ) : (
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                )}
              </svg>
            )}
            {apiSpecVersionId ? "수정하기" : "생성하기"}
          </button>

          {apiSpecVersionId && (
            <button onClick={handleDeleteApi} disabled={isLoading} className="px-3 py-1.5 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 text-sm font-medium flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              삭제하기
            </button>
          )}

          <button onClick={handleTestApi} disabled={isLoading} className="px-3 py-1.5 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50 text-sm font-medium flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
            테스트하기
          </button>
        </div>
      </div>
    </div>
  )
}

export default ApiHeader
