package com.barcoder.scrud.post.domain.entity;

import com.barcoder.scrud.global.common.baseentity.BaseTimeEntity;
import com.barcoder.scrud.global.config.generator.SnowflakeId;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "comment")
@Builder
@Getter
@AllArgsConstructor(access = lombok.AccessLevel.PRIVATE)
@NoArgsConstructor(access = lombok.AccessLevel.PROTECTED)
public class Comment extends BaseTimeEntity {

	@Id
	@SnowflakeId
	private Long commentId;

	private UUID userId;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "post_id")
	private Post post;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "parent_comment_id")
	private Comment parentComment;

	@Column(nullable = false, columnDefinition = "VARCHAR(255)")
	private String content;

	@Column(nullable = false)
	@Builder.Default
	private Long likeCount = 0L;

	@Column(nullable = false)
	@Builder.Default
	private Long dislikeCount = 0L;

	@Column(nullable = false)
	@Builder.Default
	private Boolean isUpdated = false;

	@Column(nullable = false)
	@Builder.Default
	private Boolean isDeleted = false;

	@OneToMany(mappedBy = "comment", cascade = CascadeType.ALL, orphanRemoval = true)
	private List<CommentVote> commentVotes = new ArrayList<>();

	/**
	 * 댓글 삭제
	 */
	public void delete() {
		this.isDeleted = true;
	}

	/**
	 * 댓글 수정
	 */
	public void update(String content) {
		this.content = content;
		this.isUpdated = true;
	}

	/**
	 * 이미 추천했는지 확인
	 */
	public boolean isAlreadyVoted(UUID userId) {
		return this.commentVotes.stream()
			.anyMatch(commentVote -> commentVote.getUserId().equals(userId));
	}

	/**
	 * 댓글 추천 수 증가
	 */
	public void addCommentVoteCount(CommentVote commentVote) {
		commentVote.addComment(this);
		this.commentVotes.add(commentVote);

		if (commentVote.getIsLike()) {
			this.likeCount++;
		} else {
			this.dislikeCount++;
		}
	}

	/**
	 * 사용자가 추천한 댓글인지 확인
	 */
	public String getUserVote(UUID userId) {
		return this.commentVotes.stream()
			.filter(commentVote -> commentVote.getUserId().equals(userId))
			.map(commentVote -> commentVote.getIsLike() ? "LIKE" : "DISLIKE")
			.findFirst()
			.orElse("NONE");
	}
}
