package com.barcoder.scrud.post.application.facade;

import com.barcoder.scrud.global.common.error.ErrorStatus;
import com.barcoder.scrud.global.common.exception.ExceptionHandler;
import com.barcoder.scrud.post.application.dto.in.CreatePostIn;
import com.barcoder.scrud.post.application.dto.out.CreatePostOut;
import com.barcoder.scrud.post.application.dto.out.GetPostOut;
import com.barcoder.scrud.post.application.dto.out.PostOut;
import com.barcoder.scrud.post.application.service.PostGetService;
import com.barcoder.scrud.post.application.service.PostService;
import com.barcoder.scrud.user.application.dto.out.UserOut;
import com.barcoder.scrud.user.application.usecase.UserUseCase;
import com.barcoder.scrud.user.domain.enums.UserRole;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class PostFacade {

    private final PostGetService postGetService;
    private final PostService postService;
    private final UserUseCase userUseCase;
    private final ModelMapper modelMapper;

    /**
     * 게시글 상세 조회
     *
     * @param postId 게시글 ID
     * @return GetPostOut 게시글 상세 응답 DTO
     */
    public GetPostOut getPostById(Long postId) {

        // 게시글 정보 조회
        PostOut postOut = postGetService.getPostById(postId);

        // user 정보 조회
        UserOut userOut = userUseCase.getUserById(postOut.getUserId());

        // out dto 생성
        return GetPostOut.builder()
                .post(postOut)
                .author(userOut)
                .build();
    }

    /**
     * 게시글 생성
     *
     * @param inDto 게시글 생성 요청 DTO
     * @return CreatePostOut 게시글 생성 응답 DTO
     */
    public CreatePostOut createPost(CreatePostIn inDto) {

        // 유저 확인
        UserOut userOut = userUseCase.getUserById(inDto.getUserId());

        // 관리자가 아니면 공지사항 작성 불가(categoryId 5)
        if (inDto.getCategoryId() == 5 && userOut.getRole().equals(UserRole.USER)) {
            throw new ExceptionHandler(ErrorStatus.USER_NOT_ADMIN);
        }

        // 게시글 생성
        CreatePostOut post = postService.createPost(inDto);

        return post;
    }
}
