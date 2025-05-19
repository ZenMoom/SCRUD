package com.barcoder.scrud.post.infrastructure.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.util.UUID;

@Getter
@Builder(toBuilder = true)
@AllArgsConstructor
@NoArgsConstructor
@ToString
public class CommentVoteEvent {

	private UUID userId;
	private Long commentId;
	private Boolean isLike;
}
