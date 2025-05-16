package com.barcoder.scrud.post.infrastructure.event;

import lombok.Builder;

import java.util.UUID;

@Builder(toBuilder = true)
public record PostVoteEvent(
        Long postId,
        UUID userId,
        Boolean isLike
) {
}
