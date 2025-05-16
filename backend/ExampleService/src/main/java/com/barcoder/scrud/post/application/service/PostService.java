package com.barcoder.scrud.post.application.service;

import com.barcoder.scrud.global.common.exception.BaseException;
import com.barcoder.scrud.post.application.assembler.PostAssembler;
import com.barcoder.scrud.post.application.dto.in.CreatePostIn;
import com.barcoder.scrud.post.application.dto.in.GetPostListIn;
import com.barcoder.scrud.post.application.dto.out.CreatePostOut;
import com.barcoder.scrud.post.application.dto.out.PostListOut;
import com.barcoder.scrud.post.domain.entity.Category;
import com.barcoder.scrud.post.domain.entity.Post;
import com.barcoder.scrud.post.domain.exception.PostErrorStatus;
import com.barcoder.scrud.post.domain.query.in.PostListQueryIn;
import com.barcoder.scrud.post.domain.query.out.PostListQueryOut;
import com.barcoder.scrud.post.infrastructure.jpa.CategoryJpaRepository;
import com.barcoder.scrud.post.infrastructure.jpa.PostJpaRepository;
import com.barcoder.scrud.post.infrastructure.querydsl.PostQueryDsl;
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
    private final PostQueryDsl postQueryDsl;
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
}
