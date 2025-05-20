package com.barcoder.scrud.post.infrastructure.event;

import com.barcoder.scrud.post.application.service.PostEventService;
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

    private final PostEventService postEventService;

    @EventListener
    @Transactional
    @Async
    public void PostViewEvent(PostViewEvent event) {
        postEventService.addPostViewCount(event.postId());
    }

    @EventListener
    @Transactional
    @Async
    public void PostVoteEvent(PostVoteEvent event) {
        postEventService.addPostVoteCount(event);
    }

    @EventListener
    @Transactional
    @Async
    public void CommentVoteEvent(CommentVoteEvent event) {
        postEventService.addCommentVoteCount(event);
    }
}
