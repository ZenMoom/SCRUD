package com.barcoder.scrud.post.application.facade;

import com.barcoder.scrud.global.common.exception.ExceptionHandler;
import com.barcoder.scrud.post.application.dto.out.CommentOut;
import com.barcoder.scrud.post.domain.entity.Comment;
import com.barcoder.scrud.post.domain.entity.CommentVote;
import com.barcoder.scrud.post.domain.entity.Post;
import com.barcoder.scrud.post.domain.exception.PostErrorStatus;
import com.barcoder.scrud.post.infrastructure.jpa.CommentVoteJpaRepository;
import com.barcoder.scrud.post.infrastructure.jpa.PostJpaRepository;
import com.barcoder.scrud.user.application.dto.out.UserOut;
import com.barcoder.scrud.user.application.usecase.UserUseCase;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
@Slf4j
public class CommentGetFacade {

	private final PostJpaRepository postJpaRepository;
	private final CommentVoteJpaRepository commentVoteJpaRepository;
	private final UserUseCase userUseCase;
	private final ModelMapper modelMapper;

	public List<CommentOut> getCommentList(Long postId, UUID userId) {

		// 게시글 조회
		Post post = postJpaRepository.findById(postId)
				.orElseThrow(() -> new ExceptionHandler(PostErrorStatus.POST_NOT_FOUND));

		// 댓글 리스트 조회
		List<Comment> allComents = post.getComments();

		// 댓글이 없는 경우
		if (allComents.isEmpty()) {
			return List.of();
		}

		// userId 리스트 생성
		Set<UUID> userIdList = allComents.stream()
				.map(Comment::getUserId)
				.collect(Collectors.toSet());

		// userOut 조회
		for (UUID uuid : userIdList) {
			userUseCase.getUserById(uuid);
		}

		// commentIds 리스트 추출 추가 필요
		List<Long> commentIds = allComents.stream()
				.map(Comment::getCommentId)
				.toList();
		for (Long commentId : commentIds) {
			log.info("Comment Id: {}", commentId);
		}

		List<CommentVote> allById = commentVoteJpaRepository.findAllByComment_CommentIdIn(commentIds);
		for (CommentVote commentVote : allById) {
			log.info("Comment Vote Id: {}, User Id: {}, Is Like: {}", commentVote.getComment().getCommentId(), commentVote.getUserId(), commentVote.getIsLike());
		}
		log.info("userId: {}", userId);

		Map<Long, String> commentIdToUserVoteMap = (userId != null)
				? commentVoteJpaRepository
				.findByUserIdAndComment_CommentIdIn(userId, commentIds)
				.stream()
				.collect(Collectors.toMap(
						vote -> vote.getComment().getCommentId(),
						vote -> vote.getIsLike() ? "LIKE" : "DISLIKE"
				))
				: Map.of();

		for (Long l : commentIdToUserVoteMap.keySet()) {
			log.info("Comment Id: {}, User Vote: {}", l, commentIdToUserVoteMap.get(l));
		}


		// commentOut 리스트 생성
		List<CommentOut> content = allComents.stream()
				.map(comment -> {

					// userOut 조회
					UserOut userOut = userUseCase.getUserById(comment.getUserId());

					// parentCommentId가 null인 경우
					Long parentCommentId = comment.getParentComment() != null
							? comment.getParentComment().getCommentId()
							: null;

					// userVote 조회
					String userVote = "NONE";
					if (userId != null) {
						userVote = commentIdToUserVoteMap.getOrDefault(comment.getCommentId(), "NONE");
					}

					// commentOut 생성
					return modelMapper.map(comment, CommentOut.class).toBuilder()
							.postId(comment.getPost().getPostId())
							.parentCommentId(parentCommentId)
							.userVote(userVote)
							.author(userOut)

							.build();
				})
				.toList();

		// outDto 생성
		return content;
	}
}