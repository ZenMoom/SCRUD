package com.barcoder.scrud.post.application.service;

import com.barcoder.scrud.global.common.exception.BaseException;
import com.barcoder.scrud.post.application.assembler.PostAssembler;
import com.barcoder.scrud.post.application.dto.in.CreatePostIn;
import com.barcoder.scrud.post.application.dto.out.CreatePostOut;
import com.barcoder.scrud.post.domain.entity.Category;
import com.barcoder.scrud.post.domain.entity.Post;
import com.barcoder.scrud.post.domain.exception.PostErrorStatus;
import com.barcoder.scrud.post.infrastructure.jpa.CategoryJpaRepository;
import com.barcoder.scrud.post.infrastructure.jpa.PostJpaRepository;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
@RequiredArgsConstructor
public class PostService {

    private final PostAssembler postAssembler;
    private final CategoryJpaRepository categoryJpaRepository;
    private final PostJpaRepository postJpaRepository;
    private final ModelMapper modelMapper;

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

    public void addPostViewCount(Long postId) {
        // 게시글 조회
        Post post = postJpaRepository.findById(postId)
                .orElseThrow(() -> new BaseException(PostErrorStatus.POST_NOT_FOUND));

        // 조회수 증가
        post.addPostViewCount();
    }
}
