package com.barcoder.scrud.post.application.service;

import com.barcoder.scrud.global.common.exception.BaseException;
import com.barcoder.scrud.post.application.dto.in.GetPostListIn;
import com.barcoder.scrud.post.application.dto.out.PostListOut;
import com.barcoder.scrud.post.application.dto.out.PostOut;
import com.barcoder.scrud.post.domain.entity.Post;
import com.barcoder.scrud.post.domain.exception.PostErrorStatus;
import com.barcoder.scrud.post.domain.query.in.PostListQueryIn;
import com.barcoder.scrud.post.domain.query.out.PostListQueryOut;
import com.barcoder.scrud.post.infrastructure.event.PostViewEvent;
import com.barcoder.scrud.post.infrastructure.jpa.PostJpaRepository;
import com.barcoder.scrud.post.infrastructure.querydsl.PostQueryDsl;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class PostGetService {

    private final PostJpaRepository postJpaRepository;
    private final PostQueryDsl postQueryDsl;
    private final ModelMapper modelMapper;
    private final ApplicationEventPublisher eventPublisher;

    /**
     * 게시글 리스트 조회
     *
     * @param inDto 게시글 리스트 조회 요청 DTO
     * @return PostListOut 게시글 리스트 응답 DTO
     */
    @Transactional(readOnly = true)
    public PostListOut getPostList(GetPostListIn inDto) {

        // queryInDto 생성
        PostListQueryIn queryIn = modelMapper.map(inDto, PostListQueryIn.class);

        // 리스트 조회
        PostListQueryOut queryOut = postQueryDsl.getPostList(queryIn);

        // outDto 생성
        PostListOut outDto = modelMapper.map(queryOut, PostListOut.class);

        // 반환
        return outDto;
    }

    /**
     * 게시글 상세 조회
     *
     * @param postId 게시글 ID
     * @return PostOut 게시글 상세 응답 DTO
     */
    @Transactional(readOnly = true)
    public PostOut getPostById(Long postId) {

        // 게시글 조회
        Post post = postJpaRepository.findById(postId)
                .orElseThrow(() -> new BaseException(PostErrorStatus.POST_NOT_FOUND));

        // 조회 이벤트 발행
        PostViewEvent viewEvent = PostViewEvent.builder()
                .postId(postId)
                .build();

        eventPublisher.publishEvent(viewEvent);

        // outDto 반환
        return modelMapper.map(post, PostOut.class);
    }
}
