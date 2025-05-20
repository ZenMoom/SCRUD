// store/useFeedbackStore.ts
import { CommentResponse, PostDetailResponse, PostStatusEnumDto } from '@generated/model';
import { create } from 'zustand';

interface FeedbackState {
  post: PostDetailResponse | null;
  setPost: (post: PostDetailResponse) => void;
  updateVoteCounts: (like: number, dislike: number) => void;
  updateCommentCount: (comment: number) => void;
  resetFeedback: () => void;
  comments: CommentResponse[] | [];
  setComments: (comments: CommentResponse[]) => void;
  updatePostStatusInStore: (status: PostStatusEnumDto) => void;
  updateCommentVoteCounts: (commentId: number, like: number, dislike: number) => void;
}

export const useFeedbackStore = create<FeedbackState>((set) => ({
  post: null,
  setPost: (post) => set({ post }),

  updateVoteCounts: (like, dislike) =>
    set((state) =>
      state.post
        ? {
            post: {
              ...state.post,
              likeCount: like,
              dislikeCount: dislike,
            },
          }
        : state
    ),

  updateCommentCount: (comment) =>
    set((state) =>
      state.post
        ? {
            post: {
              ...state.post,
              commentCount: comment,
            },
          }
        : state
    ),

  resetFeedback: () => set({ post: null }),

  comments: [],
  setComments: (comments) => set({ comments }),

  updatePostStatusInStore: (status) =>
    set((state) => ({
      post: state.post ? { ...state.post, status } : null,
    })),

  updateCommentVoteCounts: (commentId, like, dislike) =>
    set((state) => ({
      comments: state.comments.map((comment) =>
        comment.commentId === commentId
          ? {
              ...comment,
              likeCount: like,
              dislikeCount: dislike,
            }
          : comment
      ),
    })),
}));
