package com.barcoder.scrud.post.domain.entity;

import com.barcoder.scrud.global.common.baseentity.BaseTimeEntity;
import com.barcoder.scrud.global.config.generator.SnowflakeId;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Entity
@Table(name = "comment_vote")
@Builder
@AllArgsConstructor(access = lombok.AccessLevel.PRIVATE)
@NoArgsConstructor(access = lombok.AccessLevel.PROTECTED)
public class CommentVote extends BaseTimeEntity {

	@Id
	@SnowflakeId
	private Long commentVoteId;

	@Column(nullable = false, columnDefinition = "UNIQUE")
	private UUID userId;

	@Column(nullable = false)
	@Builder.Default
	private Boolean isLike = true;
}
