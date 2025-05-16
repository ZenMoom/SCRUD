package com.barcoder.scrud.post.presentation;

import com.barcoder.scrud.api.PostApi;
import com.barcoder.scrud.global.common.util.SecurityUtil;
import com.barcoder.scrud.model.CreatePostRequest;
import com.barcoder.scrud.model.CreatePostResponse;
import com.barcoder.scrud.model.GetPostListResponse;
import com.barcoder.scrud.model.PostDetailResponse;
import com.barcoder.scrud.model.PostOrderEnumDto;
import com.barcoder.scrud.model.PostSortEnumDto;
import com.barcoder.scrud.model.PostVoteRequest;
import com.barcoder.scrud.model.SearchTypeEnumDto;
import com.barcoder.scrud.model.UpdatePostRequest;
import com.barcoder.scrud.model.VoteResponse;
import com.barcoder.scrud.post.application.dto.in.CreatePostIn;
import com.barcoder.scrud.post.application.dto.out.CreatePostOut;
import com.barcoder.scrud.post.application.service.PostService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
@Slf4j
public class PostController implements PostApi {

    private final ModelMapper modelMapper;
    private final PostService postService;
    private final SecurityUtil securityUtil;

    /**
     * POST /api/v1/posts : 게시글 작성
     *
     * @param createPostRequest 게시글을 작성합니다. (required)
     * @return CreatePostResponse 게시글 생성 성공 응답 (status code 201)
     */
    @Override
    public ResponseEntity<CreatePostResponse> createPost(CreatePostRequest createPostRequest) {

        // userId 조회
        UUID userId = securityUtil.getCurrentUserId();

        // inDto 생성
        CreatePostIn inDto = modelMapper.map(createPostRequest, CreatePostIn.class).toBuilder()
                .userId(userId)
                .build();

        // 게시글 생성
        CreatePostOut outDto = postService.createPost(inDto);

        // response 변환
        CreatePostResponse response = modelMapper.map(outDto, CreatePostResponse.class);

        return ResponseEntity.ok(response);
    }

    /**
     * DELETE /api/v1/posts/{postId} : 게시글 삭제
     *
     * @param postId (required)
     * @return Void 성공적으로 처리되었습니다 (status code 204)
     */
    @Override
    public ResponseEntity<Void> deletePost(Long postId) {
        return null;
    }

    /**
     * GET /api/v1/posts/{postId} : 게시글 상세 조회
     *
     * @param postId (required)
     * @return PostDetailResponse 게시글 상세 조회 응답 (status code 200)
     */
    @Override
    public ResponseEntity<PostDetailResponse> getPostById(Long postId) {
        return null;
    }

    /**
     * GET /api/v1/posts : 게시글 목록 조회
     *
     * @param page       요청할 페이지 번호 (기본값: 0) (optional, default to 0)
     * @param size       페이지당 항목 수 (기본값: 10) (optional, default to 10)
     * @param sort       정렬 기준 필드 (optional)
     * @param order      정렬 방향 (optional)
     * @param keyword    검색 키워드 (optional)
     * @param type       검색 대상 필드 (optional)
     * @param categoryId 카테고리 ID (optional)
     * @return GetPostListResponse 게시글 목록 조회 응답 (status code 200)
     */
    @Override
    public ResponseEntity<GetPostListResponse> getPostList(Integer page, Integer size, PostSortEnumDto sort, PostOrderEnumDto order, String keyword, SearchTypeEnumDto type, Integer categoryId) {
        return null;
    }

    /**
     * PATCH /api/v1/posts/{postId} : 게시글 수정
     *
     * @param postId            (required)
     * @param updatePostRequest 게시글을 수정합니다. (required)
     * @return Void 성공적으로 처리되었습니다 (status code 200)
     */
    @Override
    public ResponseEntity<Void> updatePost(Long postId, UpdatePostRequest updatePostRequest) {
        return null;
    }

    /**
     * POST /api/v1/posts/{postId}/vote : 게시글 추천/비추천
     *
     * @param postId          (required)
     * @param postVoteRequest 게시글 추천/비추천 요청입니다. (required)
     * @return VoteResponse 게시글 추천/비추천 응답 (status code 200)
     */
    @Override
    public ResponseEntity<VoteResponse> votePost(Long postId, PostVoteRequest postVoteRequest) {
        return null;
    }

    public ModelMapper getModelMapper() {
        return modelMapper;
    }
}
