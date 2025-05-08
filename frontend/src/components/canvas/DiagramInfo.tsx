interface DiagramInfoProps {
  metadata: {
    metadataId: string
    version: string
    lastModified: string
    name: string
    description: string
  }
}

export function DiagramInfo({ metadata }: DiagramInfoProps) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-xl font-bold">{metadata.name}</h2>
      <p className="text-sm text-gray-600">{metadata.description}</p>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mt-1">
        <div>버전: {metadata.version}</div>
        <div>마지막 수정: {new Date(metadata.lastModified).toLocaleString()}</div>
      </div>
    </div>
  )
}
