package com.barcoder.scrud.post.application.service;

import com.barcoder.scrud.global.common.exception.BaseException;
import com.barcoder.scrud.post.application.assembler.PostAssembler;
import com.barcoder.scrud.post.application.dto.in.CreatePostIn;
import com.barcoder.scrud.post.application.dto.in.PostVoteIn;
import com.barcoder.scrud.post.application.dto.in.UpdatePostIn;
import com.barcoder.scrud.post.application.dto.in.UpdatePostStatusIn;
import com.barcoder.scrud.post.application.dto.out.CreatePostOut;
import com.barcoder.scrud.post.application.dto.out.PostVoteOut;
import com.barcoder.scrud.post.domain.entity.Category;
import com.barcoder.scrud.post.domain.entity.Post;
import com.barcoder.scrud.post.domain.exception.PostErrorStatus;
import com.barcoder.scrud.post.infrastructure.event.PostVoteEvent;
import com.barcoder.scrud.post.infrastructure.jpa.CategoryJpaRepository;
import com.barcoder.scrud.post.infrastructure.jpa.PostJpaRepository;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
public class PostService {

    private final PostAssembler postAssembler;
    private final CategoryJpaRepository categoryJpaRepository;
    private final PostJpaRepository postJpaRepository;
    private final ModelMapper modelMapper;
    private final ApplicationEventPublisher eventPublisher;

    /**
     * 게시글 생성
     *
     * @param inDto 게시글 생성 요청 DTO
     * @return CreatePostOut 게시글 생성 응답 DTO
     */
    public CreatePostOut createPost(CreatePostIn inDto) {

        // category 조회
        Category category = categoryJpaRepository.findById(inDto.getCategoryId())
                .orElseThrow(() -> new BaseException(PostErrorStatus.CATEGORY_NOT_FOUND));

        // entity 생성
        Post post = postAssembler.toPostEntity(inDto, category);

        // entity 저장
        postJpaRepository.save(post);

        // outDto 생성 및 반환
        return modelMapper.map(post, CreatePostOut.class);
    }

    /**
     * 게시글 수정
     *
     * @param inDto 게시글 수정 요청 DTO
     */
    public void updatePost(UpdatePostIn inDto) {

        // 게시글 조회
        Post post = postJpaRepository.findById(inDto.getPostId())
                .orElseThrow(() -> new BaseException(PostErrorStatus.POST_NOT_FOUND));

        // entity 수정
        post.updateTitle(inDto.getTitle());
        post.updateContent(inDto.getContent());
    }

    /**
     * 게시글 추천 / 비추천
     *
     * @param inDto 게시글 추천/비추천 요청 DTO
     * @return PostVoteOut 게시글 추천/비추천 응답 DTO
     */
    @Transactional
    public PostVoteOut votePost(PostVoteIn inDto) {

        // 게시글 조회
        Post post = postJpaRepository.findById(inDto.getPostId())
                .orElseThrow(() -> new BaseException(PostErrorStatus.POST_NOT_FOUND));

        // 이미 추천한 게시글인지 확인
        if (post.isAlreadyVoted(inDto.getUserId())) {
            throw new BaseException(PostErrorStatus.POST_ALREADY_VOTED);
        }

        // 응답 DTO를 위한 값 +1 처리 (응답에서 증가된 값 보여줌)
        long likeCount = post.getLikeCount();
        long dislikeCount = post.getDislikeCount();

        // 추천/비추천 처리
        if (inDto.getIsLike()) likeCount++;
        else dislikeCount++;

        // 조회수 증가 이벤트 발행 (실제 DB에는 비동기로 반영)
        PostVoteEvent event = modelMapper.map(inDto, PostVoteEvent.class);

        eventPublisher.publishEvent(event);

        // 반환
        return PostVoteOut.builder()
                .likeCount(likeCount)
                .dislikeCount(dislikeCount)
                .build();
    }

    /**
     * 게시글 상태 변경
     *
     * @param inDto 게시글 상태 변경 요청 DTO
     */
    public void updatePostStatus(UpdatePostStatusIn inDto) {

        // 게시글 조회
        Post post = postJpaRepository.findById(inDto.getPostId())
                .orElseThrow(() -> new BaseException(PostErrorStatus.POST_NOT_FOUND));

        // entity 수정
        post.changeStatus(inDto.getStatus());

    }

    /**
     * 게시글 삭제
     *
     * @param postId 게시글 ID
     * @param userId 사용자 ID
     */
    public void deletePost(Long postId, UUID userId) {

        // 게시글 조회
        Post post = postJpaRepository.findById(postId)
                .orElseThrow(() -> new BaseException(PostErrorStatus.POST_NOT_FOUND));

        // 게시글 작성자와 요청자가 다를 경우 예외 처리
        if (!post.getUserId().equals(userId)) {
            throw new BaseException(PostErrorStatus.POST_NOT_AUTHORIZED);
        }

        // 게시글 삭제
        postJpaRepository.delete(post);
    }
}
