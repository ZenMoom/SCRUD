package com.barcoder.scrud.post.domain.entity;

import com.barcoder.scrud.global.common.baseentity.BaseTimeEntity;
import com.barcoder.scrud.global.config.generator.SnowflakeId;
import com.fasterxml.jackson.annotation.JsonIgnore;
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
@Table(name = "post")
@Builder
@Getter
@AllArgsConstructor(access = lombok.AccessLevel.PRIVATE)
@NoArgsConstructor(access = lombok.AccessLevel.PROTECTED)
public class Post extends BaseTimeEntity {

	@Id
	@SnowflakeId
	private Long postId;

	private UUID userId;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "category_id")
	private Category category;

	@Column(nullable = false, columnDefinition = "VARCHAR(255)")
	private String title;

	@Column(nullable = false, columnDefinition = "LONGTEXT")
	private String content;

	@Column(nullable = false)
	@Builder.Default
	private Long viewCount = 0L;

	@Column(nullable = false)
	@Builder.Default
	private Long likeCount = 0L;

	@Column(nullable = false)
	@Builder.Default
	private Long dislikeCount = 0L;

	@Column(nullable = false)
	@Builder.Default
	private Long commentCount = 0L;

	@JsonIgnore
	@OneToMany(mappedBy = "post")
	private List<Comment> comments = new ArrayList<>();

	@JsonIgnore
	@OneToMany(mappedBy = "post")
	private List<PostVote> postVotes = new ArrayList<>();

	// 조회수 증가
	public void addPostViewCount() {
		this.viewCount++;
	}

	// 제목 변경
	public void updateTitle(String title) {
		this.title = title;
	}

	// 내용 변경
	public void updateContent(String content) {
		this.content = content;
	}

	// 좋아요, 싫어요 수 증가
	public void addPostVoteCount(Boolean isLike, UUID userId) {

		// 이미 투표한 경우
		for (PostVote postVote : this.postVotes) {
			if (postVote.getUserId().equals(userId)) {
				return;
			}
		}

		if (isLike) {
			this.likeCount++;
		} else {
			this.dislikeCount++;
		}
	}
}
