"use client"

interface NewProjectCardProps {
  onClick: () => void
}

export default function NewProjectCard({ onClick }: NewProjectCardProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center h-[230px] w-full rounded-lg bg-white border border-gray-200 shadow-sm cursor-pointer transition-all duration-200 hover:shadow-md"
    >
      <div className="text-5xl text-gray-400 font-light">+</div>
    </button>
  )
}
