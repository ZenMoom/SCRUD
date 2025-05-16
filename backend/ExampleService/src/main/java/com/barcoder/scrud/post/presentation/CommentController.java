package com.barcoder.scrud.post.presentation;

import com.barcoder.scrud.api.CommentApi;
import com.barcoder.scrud.global.common.util.SecurityUtil;
import com.barcoder.scrud.model.CommentResponse;
import com.barcoder.scrud.model.CommentVoteRequest;
import com.barcoder.scrud.model.CreateCommentRequest;
import com.barcoder.scrud.model.GetCommentListResponse;
import com.barcoder.scrud.model.UpdateCommentRequest;
import com.barcoder.scrud.model.VoteCommentResponse;
import com.barcoder.scrud.post.application.dto.in.CreateCommentIn;
import com.barcoder.scrud.post.application.dto.out.CommentOut;
import com.barcoder.scrud.post.application.facade.CommentCreateFacade;
import com.barcoder.scrud.post.application.facade.CommentGetFacade;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class CommentController implements CommentApi {

    private final CommentCreateFacade commentCreateFacade;
    private final CommentGetFacade commentGetFacade;
    private final SecurityUtil securityUtil;
    private final ModelMapper modelMapper;


    /**
     * POST /api/v1/posts/{postId}/comments : 댓글 작성
     *
     * @param postId               (required)
     * @param createCommentRequest 댓글 작성 요청 (required)
     * @return Void 성공적으로 생성되었습니다 (status code 201)
     */
    @Override
    public ResponseEntity<Void> createComment(Long postId, CreateCommentRequest createCommentRequest) {

        // userId 조회
        UUID userId = securityUtil.getCurrentUserId();

        // inDto 생성
        CreateCommentIn inDto = modelMapper.map(createCommentRequest, CreateCommentIn.class).toBuilder()
                .postId(postId)
                .userId(userId)
                .build();

        // 댓글 작성
        commentCreateFacade.createComment(inDto);

        // 반환
        return ResponseEntity.ok().build();
    }

    /**
     * DELETE /api/v1/comments/{commentId} : 댓글 삭제
     *
     * @param commentId (required)
     * @return Void 성공적으로 처리되었습니다 (status code 204)
     */
    @Override
    public ResponseEntity<Void> deleteComment(Long commentId) {
        return null;
    }

    /**
     * GET /api/v1/posts/{postId}/comments : 댓글 조회
     *
     * @param postId (required)
     * @return GetCommentListResponse 댓글 목록 조회 성공 (status code 200)
     */
    @Override
    public ResponseEntity<GetCommentListResponse> getCommentList(Long postId) {

        // 댓글 목록 조회
        List<CommentOut> outDtoList = commentGetFacade.getCommentList(postId);

        // response 변환
        List<CommentResponse> content = outDtoList.stream()
                .map(commentOut -> modelMapper.map(commentOut, CommentResponse.class))
                .toList();

        GetCommentListResponse response = GetCommentListResponse.builder()
                .content(content)
                .build();

        return ResponseEntity.ok(response);
    }

    /**
     * PATCH /api/v1/comments/{commentId} : 댓글 수정
     *
     * @param commentId            (required)
     * @param updateCommentRequest 댓글을 수정합니다. (required)
     * @return Void 성공적으로 처리되었습니다 (status code 200)
     */
    @Override
    public ResponseEntity<Void> updateComment(Long commentId, UpdateCommentRequest updateCommentRequest) {
        return null;
    }

    /**
     * POST /api/v1/comments/{commentId}/vote : 댓글 추천/비추천
     *
     * @param commentId (required)
     * @param commentVoteRequest      댓글 추천/비추천 요청입니다. (required)
     * @return VoteCommentResponse 댓글 추천/비추천 성공 (status code 200)
     */
    @Override
    public ResponseEntity<VoteCommentResponse> voteComment(Long commentId, CommentVoteRequest commentVoteRequest) {
        return null;
    }
}
