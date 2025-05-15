package com.barcoder.scrud.post.domain.entity;

import com.barcoder.scrud.global.common.baseentity.BaseTimeEntity;
import com.barcoder.scrud.global.config.generator.SnowflakeId;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Entity
@Table(name = "post_vote")
@Builder
@AllArgsConstructor(access = lombok.AccessLevel.PRIVATE)
@NoArgsConstructor(access = lombok.AccessLevel.PROTECTED)
public class PostVote extends BaseTimeEntity {

	@Id
	@SnowflakeId
	private Long postVoteId;

	@Column(nullable = false, columnDefinition = "UNIQUE")
	private UUID userId;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "post_id")
	private Post post;

	@Column(nullable = false, columnDefinition = "TINYINT(1)")
	@Builder.Default
	private Boolean isLike = true;
}
