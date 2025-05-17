package com.barcoder.scrud.post.application.facade;

import com.barcoder.scrud.post.application.dto.out.GetPostOut;
import com.barcoder.scrud.post.application.dto.out.PostOut;
import com.barcoder.scrud.post.application.service.PostGetService;
import com.barcoder.scrud.user.application.dto.out.UserOut;
import com.barcoder.scrud.user.application.usecase.UserUseCase;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class PostGetFacade {

    private final PostGetService postGetService;
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
}
