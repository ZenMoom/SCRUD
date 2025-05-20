package com.barcoder.scrud.post.application.service;

import com.barcoder.scrud.global.common.exception.ExceptionHandler;
import com.barcoder.scrud.post.application.assembler.CommentAssembler;
import com.barcoder.scrud.post.application.assembler.PostAssembler;
import com.barcoder.scrud.post.domain.entity.Comment;
import com.barcoder.scrud.post.domain.entity.CommentVote;
import com.barcoder.scrud.post.domain.entity.Post;
import com.barcoder.scrud.post.domain.entity.PostVote;
import com.barcoder.scrud.post.domain.exception.PostErrorStatus;
import com.barcoder.scrud.post.infrastructure.event.CommentVoteEvent;
import com.barcoder.scrud.post.infrastructure.event.PostVoteEvent;
import com.barcoder.scrud.post.infrastructure.jpa.CommentJpaRepository;
import com.barcoder.scrud.post.infrastructure.jpa.PostJpaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Transactional
@Service
@RequiredArgsConstructor
public class PostEventService {

	private final PostAssembler postAssembler;
	private final CommentAssembler commentAssembler;
	private final CommentJpaRepository commentJpaRepository;
	private final PostJpaRepository postJpaRepository;


	/**
	 * 게시글 조회수 증가
	 *
	 * @param postId 게시글 ID
	 */
	public void addPostViewCount(Long postId) {
		// 게시글 조회
		Post post = postJpaRepository.findById(postId)
				.orElseThrow(() -> new ExceptionHandler(PostErrorStatus.POST_NOT_FOUND));

		// 조회수 증가
		post.addPostViewCount();
	}

	/**
	 * 게시글 추천 / 비추천 이벤트 처리
	 *
	 * @param event 게시글 추천/비추천 이벤트
	 */
	public void addPostVoteCount(PostVoteEvent event) {

		// 게시글 조회
		Post post = postJpaRepository.findById(event.getPostId())
				.orElseThrow(() -> new ExceptionHandler(PostErrorStatus.POST_NOT_FOUND));

		// 이미 투표한 경우
		if (post.isAlreadyVoted(event.getUserId())) {
			throw new ExceptionHandler(PostErrorStatus.POST_ALREADY_VOTED);
		}

		// PostVoteEntity 생성
		PostVote postVote = postAssembler.toPostVoteEntity(event);

		// 추천/비추천 처리
		post.addPostVoteCount(postVote);

	}

	/**
	 * 댓글 추천 / 비추천 이벤트 처리
	 *
	 * @param event 댓글 추천/비추천 이벤트
	 */
	public void addCommentVoteCount(CommentVoteEvent event) {
		// 댓글 조회
		Comment comment = commentJpaRepository.findById(event.getCommentId())
				.orElseThrow(() -> new ExceptionHandler(PostErrorStatus.COMMENT_NOT_FOUND));

		// 이미 투표한 경우
		if (comment.isAlreadyVoted(event.getUserId())) {
			throw new ExceptionHandler(PostErrorStatus.COMMENT_ALREADY_VOTED);
		}

		// CommentVoteEntity 생성
		CommentVote commentVote = commentAssembler.toCommentVoteEntity(event);

		// 추천/비추천 처리
		comment.addCommentVoteCount(commentVote);
	}
}
