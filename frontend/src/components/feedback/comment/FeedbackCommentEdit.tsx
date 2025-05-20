import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Save, X } from 'lucide-react';

export default function FeedbackCommentEdit({
  editedContent,
  setEditedContent,
  handleSaveEdit,
  handleCancelEdit,
  isSubmittingEdit,
}: {
  editedContent: string;
  setEditedContent: (content: string) => void;
  handleSaveEdit: () => Promise<void>;
  handleCancelEdit: () => void;
  isSubmittingEdit: boolean;
}) {
  return (
    <>
      <Textarea
        value={editedContent}
        onChange={(e) => setEditedContent(e.target.value)}
        placeholder='댓글을 입력하세요...'
        className='min-h-[100px] mb-2'
        disabled={isSubmittingEdit}
      />
      <div className='flex justify-end gap-2'>
        <Button
          variant='outline'
          size='sm'
          onClick={handleCancelEdit}
          disabled={isSubmittingEdit}
          className='flex items-center gap-1'
        >
          <X className='w-4 h-4' /> 취소
        </Button>
        <Button
          size='sm'
          onClick={handleSaveEdit}
          disabled={isSubmittingEdit}
          className='hover:bg-blue-700 flex items-center gap-1 bg-blue-600'
        >
          {isSubmittingEdit ? (
            '저장 중...'
          ) : (
            <>
              <Save className='w-4 h-4' /> 저장
            </>
          )}
        </Button>
      </div>
    </>
  );
}
