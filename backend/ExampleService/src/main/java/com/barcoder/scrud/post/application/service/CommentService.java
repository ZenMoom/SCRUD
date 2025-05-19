package com.barcoder.scrud.post.application.service;

import com.barcoder.scrud.global.common.exception.ExceptionHandler;
import com.barcoder.scrud.post.application.assembler.CommentAssembler;
import com.barcoder.scrud.post.application.dto.in.CommentVoteIn;
import com.barcoder.scrud.post.application.dto.in.CreateCommentCommand;
import com.barcoder.scrud.post.application.dto.out.CommentOut;
import com.barcoder.scrud.post.application.dto.out.CommentVoteOut;
import com.barcoder.scrud.post.domain.entity.Comment;
import com.barcoder.scrud.post.domain.exception.PostErrorStatus;
import com.barcoder.scrud.post.infrastructure.event.CommentVoteEvent;
import com.barcoder.scrud.post.infrastructure.jpa.CommentJpaRepository;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
@RequiredArgsConstructor
public class CommentService {

	private final CommentAssembler commentAssembler;
	private final CommentJpaRepository commentJpaRepository;
	private final ModelMapper modelMapper;
	private final ApplicationEventPublisher eventPublisher;

	/**
	 * 댓글 생성
	 *
	 * @param command 댓글 생성 요청 DTO
	 */
	public CommentOut createComment(CreateCommentCommand command) {

		// entity 생성
		Comment comment = commentAssembler.toCommentEntity(command);

		// entity 저장
		commentJpaRepository.save(comment);

		return modelMapper.map(comment, CommentOut.class);
	}

	/**
	 * 댓글 추천 / 비추천
	 *
	 * @param inDto 댓글 추천 / 비추천 요청 DTO
	 * @return CommentVoteOut 댓글 추천 / 비추천 응답 DTO
	 */
	public CommentVoteOut voteComment(CommentVoteIn inDto) {

		// 댓글 조회
		Comment comment = commentJpaRepository.findById(inDto.getCommentId())
				.orElseThrow(() -> new ExceptionHandler(PostErrorStatus.COMMENT_NOT_FOUND));

		// 추천 수 확인
		long likeCount = comment.getLikeCount();
		long dislikeCount = comment.getDislikeCount();

		// 추천 / 비추천 처리
		if (inDto.getIsLike()) {
			likeCount++;
		} else {
			dislikeCount++;
		}

		// 댓글 추천 / 비추천 이벤트
		CommentVoteEvent event = modelMapper.map(inDto, CommentVoteEvent.class);
		eventPublisher.publishEvent(event);

		// outDto 반환
		return CommentVoteOut.builder()
				.likeCount(likeCount)
				.dislikeCount(dislikeCount)
				.build();
	}
}
