interface FileContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  content: string;
}

export default function FileContentModal({ isOpen, onClose, fileName, content }: FileContentModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg w-[80%] max-w-4xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">{fileName}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            &times;
          </button>
        </div>
        <div className="p-4 overflow-auto flex-1">
          <pre className="whitespace-pre-wrap font-mono text-sm">
            {content}
          </pre>
        </div>
      </div>
    </div>
  );
} 