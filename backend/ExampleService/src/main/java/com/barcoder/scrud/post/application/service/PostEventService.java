package com.barcoder.scrud.post.application.service;

import com.barcoder.scrud.global.common.exception.BaseException;
import com.barcoder.scrud.post.application.assembler.PostAssembler;
import com.barcoder.scrud.post.domain.entity.Post;
import com.barcoder.scrud.post.domain.entity.PostVote;
import com.barcoder.scrud.post.domain.exception.PostErrorStatus;
import com.barcoder.scrud.post.infrastructure.event.PostVoteEvent;
import com.barcoder.scrud.post.infrastructure.jpa.CategoryJpaRepository;
import com.barcoder.scrud.post.infrastructure.jpa.PostJpaRepository;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Transactional
@Service
@RequiredArgsConstructor
public class PostEventService {

    private final PostAssembler postAssembler;
    private final CategoryJpaRepository categoryJpaRepository;
    private final PostJpaRepository postJpaRepository;


    /**
     * 게시글 조회수 증가
     *
     * @param postId 게시글 ID
     */
    public void addPostViewCount(Long postId) {
        // 게시글 조회
        Post post = postJpaRepository.findById(postId)
                .orElseThrow(() -> new BaseException(PostErrorStatus.POST_NOT_FOUND));

        // 조회수 증가
        post.addPostViewCount();
    }

    /**
     * 게시글 추천 / 비추천 이벤트 처리
     *
     * @param event 게시글 추천/비추천 이벤트
     */
    public void addPostVoteCount(PostVoteEvent event) {

        // 게시글 조회
        Post post = postJpaRepository.findById(event.postId())
                .orElseThrow(() -> new BaseException(PostErrorStatus.POST_NOT_FOUND));

        // 이미 투표한 경우
        if (post.isAlreadyVoted(event.userId())) {
            throw new BaseException(PostErrorStatus.POST_ALREADY_LIKED);
        }

        // PostVoteEntity 생성
        PostVote postVote = postAssembler.toPostVoteEntity(event);

        // 추천/비추천 처리
        post.addPostVoteCount(postVote);

    }
}
