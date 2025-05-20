package com.barcoder.scrud.post.presentation;

import com.barcoder.scrud.api.CommentApi;
import com.barcoder.scrud.global.common.error.ErrorStatus;
import com.barcoder.scrud.global.common.exception.ExceptionHandler;
import com.barcoder.scrud.global.common.util.SecurityUtil;
import com.barcoder.scrud.model.CommentResponse;
import com.barcoder.scrud.model.CommentVoteRequest;
import com.barcoder.scrud.model.CreateCommentRequest;
import com.barcoder.scrud.model.GetCommentListResponse;
import com.barcoder.scrud.model.UpdateCommentRequest;
import com.barcoder.scrud.model.VoteCommentResponse;
import com.barcoder.scrud.post.application.dto.in.CommentVoteIn;
import com.barcoder.scrud.post.application.dto.in.CreateCommentIn;
import com.barcoder.scrud.post.application.dto.in.UpdateCommentIn;
import com.barcoder.scrud.post.application.dto.out.CommentOut;
import com.barcoder.scrud.post.application.dto.out.CommentVoteOut;
import com.barcoder.scrud.post.application.facade.CommentFacade;
import com.barcoder.scrud.post.application.facade.CommentGetFacade;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@Slf4j
public class CommentController implements CommentApi {

	private final CommentFacade commentFacade;
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
	public ResponseEntity<CommentResponse> createComment(Long postId, CreateCommentRequest createCommentRequest) {

		// userId 조회
		UUID userId = securityUtil.getCurrentUserId();

		// inDto 생성
		CreateCommentIn inDto = modelMapper.map(createCommentRequest, CreateCommentIn.class).toBuilder()
				.postId(postId)
				.userId(userId)
				.build();

		// 댓글 작성
		CommentOut outDto = commentFacade.createComment(inDto);

		// response 변환
		CommentResponse response = modelMapper.map(outDto, CommentResponse.class);

		// 반환
		return ResponseEntity.ok(response);
	}

	/**
	 * DELETE /api/v1/comments/{commentId} : 댓글 삭제
	 *
	 * @param commentId (required)
	 * @return Void 성공적으로 처리되었습니다 (status code 204)
	 */
	@Override
	public ResponseEntity<Void> deleteComment(Long commentId) {
		// userId 조회
		UUID userId = securityUtil.getCurrentUserId();
		// 댓글 삭제
		commentFacade.deleteComment(commentId, userId);
		return ResponseEntity.ok().build();
	}

	/**
	 * GET /api/v1/posts/{postId}/comments : 댓글 조회
	 *
	 * @param postId (required)
	 * @return GetCommentListResponse 댓글 목록 조회 성공 (status code 200)
	 */
	@Override
	public ResponseEntity<GetCommentListResponse> getCommentList(Long postId) {

		// userId 조회
		UUID userId = null;

		try {
			userId = securityUtil.getCurrentUserId(); // 로그인 사용자면 userId 반환
		} catch (ExceptionHandler e) {
			if (e.getCode() == ErrorStatus._UNAUTHORIZED) {
				log.info("비로그인 사용자 → 댓글 투표 상태 없음");
			} else {
				throw e; // 그 외는 예외 터뜨림
			}
		}

		// 댓글 목록 조회
		List<CommentOut> outDtoList = commentGetFacade.getCommentList(postId, userId);

		// response 변환
		List<CommentResponse> content = outDtoList.stream()
				.map(commentOut -> {
					CommentResponse comment = modelMapper.map(commentOut, CommentResponse.class);
					if (comment.getIsDeleted()) {
						comment.setContent("삭제된 댓글입니다.");
					}
					return comment;
				})
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

		// userId 조회
		UUID userId = securityUtil.getCurrentUserId();

		// inDto 생성
		UpdateCommentIn inDto = modelMapper.map(updateCommentRequest, UpdateCommentIn.class).toBuilder()
				.commentId(commentId)
				.userId(userId)
				.build();

		// 댓글 수정
		commentFacade.updateComment(inDto);

		return ResponseEntity.ok().build();
	}

	/**
	 * POST /api/v1/comments/{commentId}/vote : 댓글 추천/비추천
	 *
	 * @param commentId          (required)
	 * @param commentVoteRequest 댓글 추천/비추천 요청입니다. (required)
	 * @return VoteCommentResponse 댓글 추천/비추천 성공 (status code 200)
	 */
	@Override
	public ResponseEntity<VoteCommentResponse> voteComment(Long commentId, CommentVoteRequest commentVoteRequest) {
		// userId 조회
		UUID userId = securityUtil.getCurrentUserId();

		// inDto 생성
		CommentVoteIn inDto = modelMapper.map(commentVoteRequest, CommentVoteIn.class).toBuilder()
				.userId(userId)
				.commentId(commentId)
				.build();

		// 댓글 추천/비추천
		CommentVoteOut outDto = commentFacade.voteComment(inDto);

		// response 변환
		VoteCommentResponse response = modelMapper.map(outDto, VoteCommentResponse.class);
		return ResponseEntity.ok(response);
	}
}
