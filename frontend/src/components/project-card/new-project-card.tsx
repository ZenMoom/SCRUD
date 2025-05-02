"use client"

interface NewProjectCardProps {
  onClick: () => void
}

export default function NewProjectCard({ onClick }: NewProjectCardProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center h-[200px] w-full rounded-lg bg-gray-50 border-2 border-dashed border-gray-300 cursor-pointer transition-colors hover:bg-gray-100"
    >
      <div className="text-4xl text-gray-400">+</div>
    </button>
  )
}
