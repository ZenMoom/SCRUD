package com.barcoder.scrud.post.infrastructure.event;

import com.barcoder.scrud.post.application.service.PostService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@RequiredArgsConstructor
public class PostEventHandler {

    private final PostService postService;

    @EventListener
    @Transactional
    @Async
    public void PostViewEvent(PostViewEvent event) {
        postService.addPostViewCount(event.postId());
    }
}
