package com.barcoder.scrud.post.infrastructure.event;

import lombok.Builder;

@Builder(toBuilder = true)
public record PostViewEvent(Long postId) {
}
