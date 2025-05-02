interface FloatingbuttonProps {
  isActive: boolean
}

export default function Floatingbutton({ isActive }: FloatingbuttonProps) {
  return (
    <button 
      className={`fixed bottom-8 right-8 py-3 px-7 rounded-lg text-base font-medium border-none shadow-md transition-all duration-300 ease-in-out z-100
      ${isActive 
        ? 'bg-blue-500 text-white hover:bg-blue-600' 
        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
      }`} 
      disabled={!isActive}
    >
      프로젝트 생성
    </button>
  )
}