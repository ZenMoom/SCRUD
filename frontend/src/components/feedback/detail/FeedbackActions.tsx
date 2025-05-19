'use client';

import useAuthStore from '@/app/store/useAuthStore';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { deletePost } from '@/lib/feedback-api';
import { useFeedbackStore } from '@/store/useFeedbackStore';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function FeedbackActions() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { post } = useFeedbackStore();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!post || !user || user.username !== post.author?.username) {
    return null;
  }

  const handleEdit = () => {
    router.push(`/feedback/${post.postId}/edit`);
  };

  const handleDelete = async () => {
    if (!post.postId) return;

    setIsDeleting(true);
    try {
      await deletePost(post.postId);
      router.push('/feedback');
      router.refresh();
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('피드백 삭제 중 오류가 발생했습니다.');
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className='hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 flex items-center justify-center w-8 h-8 transition-colors rounded-full'>
          <MoreHorizontal className='w-5 h-5 text-gray-500' />
          <span className='sr-only'>피드백 관리</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align='end'
          className='w-36'
        >
          <DropdownMenuItem
            onClick={handleEdit}
            className='flex items-center cursor-pointer'
          >
            <Pencil className='w-4 h-4 mr-2' />
            수정하기
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setIsDeleteDialogOpen(true)}
            className='focus:text-red-600 flex items-center text-red-600 cursor-pointer'
          >
            <Trash2 className='w-4 h-4 mr-2' />
            삭제하기
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent className='max-w-md'>
          <AlertDialogHeader>
            <AlertDialogTitle>피드백 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 이 피드백을 삭제하시겠습니까? 이 작업은 되돌릴 수 없으며, 모든 댓글도 함께 삭제됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isDeleting}
              className='font-medium'
            >
              취소
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className='hover:bg-red-700 focus:ring-red-600 font-medium bg-red-600'
            >
              {isDeleting ? '삭제 중...' : '삭제'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
