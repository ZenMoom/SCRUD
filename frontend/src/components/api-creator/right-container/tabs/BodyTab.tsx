import React from "react"
import { BodyParam, BodyModeType, RawBodyFormatType } from "../types"

interface BodyTabProps {
  bodyMode: BodyModeType
  setBodyMode: (mode: BodyModeType) => void
  method: string
  rawBodyFormat: RawBodyFormatType
  setRawBodyFormat: (format: RawBodyFormatType) => void
  rawBody: string
  setRawBody: (body: string) => void
  formatJson: (json: string, setter: (formatted: string) => void) => void
  bodyParams: BodyParam[]
  setBodyParams: (params: BodyParam[]) => void
}

const BodyTab: React.FC<BodyTabProps> = ({ bodyMode, setBodyMode, method, rawBodyFormat, setRawBodyFormat, rawBody, setRawBody, formatJson, bodyParams, setBodyParams }) => {
  return (
    <div>
      <div className="mb-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">Body Type</label>
        <div className="flex space-x-2">
          <button
            className={`px-2 py-1 text-sm rounded border ${bodyMode === "none" ? "bg-blue-100 border-blue-500" : ""}`}
            onClick={() => setBodyMode("none")}
            disabled={method === "GET"} // GET 메서드는 body가 없음
          >
            None
          </button>
          <button
            className={`px-2 py-1 text-sm rounded border ${bodyMode === "raw" ? "bg-blue-100 border-blue-500" : ""}`}
            onClick={() => setBodyMode("raw")}
            disabled={method === "GET"} // GET 메서드는 body가 없음
          >
            Raw
          </button>
          <button
            className={`px-2 py-1 text-sm rounded border ${bodyMode === "form-data" ? "bg-blue-100 border-blue-500" : ""}`}
            onClick={() => setBodyMode("form-data")}
            disabled={method === "GET"} // GET 메서드는 body가 없음
          >
            Form Data
          </button>
          <button
            className={`px-2 py-1 text-sm rounded border ${bodyMode === "x-www-form-urlencoded" ? "bg-blue-100 border-blue-500" : ""}`}
            onClick={() => setBodyMode("x-www-form-urlencoded")}
            disabled={method === "GET"} // GET 메서드는 body가 없음
          >
            x-www-form-urlencoded
          </button>
        </div>
      </div>

      {bodyMode === "raw" && (
        <div>
          <div className="flex justify-between mb-2">
            <div>
              <select className="border rounded px-2 py-1 text-sm" value={rawBodyFormat} onChange={(e) => setRawBodyFormat(e.target.value as RawBodyFormatType)}>
                <option value="json">JSON</option>
                <option value="text">Text</option>
                <option value="xml">XML</option>
                <option value="javascript">JavaScript</option>
                <option value="html">HTML</option>
              </select>
            </div>

            {rawBodyFormat === "json" && rawBody.trim() && (
              <button className="px-2 py-1 text-sm border rounded hover:bg-gray-100" onClick={() => formatJson(rawBody, setRawBody)}>
                Format JSON
              </button>
            )}
          </div>

          <textarea
            className="w-full border rounded px-2 py-1 font-mono text-sm"
            value={rawBody}
            onChange={(e) => setRawBody(e.target.value)}
            disabled={method === "GET"} // GET 메서드는 body가 없음
            style={{ height: "180px" }}
          />
        </div>
      )}

      {(bodyMode === "form-data" || bodyMode === "x-www-form-urlencoded") && (
        <div>
          <div className="grid grid-cols-12 gap-2 mb-2 font-medium">
            <div className="col-span-5">Key</div>
            <div className="col-span-6">Value</div>
            <div className="col-span-1"></div>
          </div>

          {bodyParams.map((param, index) => (
            <div key={index} className="grid grid-cols-12 gap-2 mb-2">
              <input
                className="col-span-5 border rounded px-3 py-2"
                value={param.key}
                onChange={(e) => {
                  const newParams = [...bodyParams]
                  newParams[index].key = e.target.value
                  setBodyParams(newParams)
                }}
              />
              <input
                className="col-span-6 border rounded px-3 py-2"
                value={param.value}
                onChange={(e) => {
                  const newParams = [...bodyParams]
                  newParams[index].value = e.target.value
                  setBodyParams(newParams)
                }}
              />
              <button
                className="col-span-1 text-red-500 hover:text-red-700"
                onClick={() => {
                  const newParams = [...bodyParams]
                  newParams.splice(index, 1)
                  if (newParams.length === 0) {
                    setBodyParams([{ key: "", value: "" }])
                  } else {
                    setBodyParams(newParams)
                  }
                }}
              >
                X
              </button>
            </div>
          ))}

          <button className="px-3 py-1 border rounded hover:bg-gray-100" onClick={() => setBodyParams([...bodyParams, { key: "", value: "" }])}>
            Add Param
          </button>
        </div>
      )}

      {(method === "GET" || bodyMode === "none") && <div className="text-gray-500 italic">GET 요청 또는 None 타입에서는 Body를 사용할 수 없습니다.</div>}
    </div>
  )
}

export default BodyTab
