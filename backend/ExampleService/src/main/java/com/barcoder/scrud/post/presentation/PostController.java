package com.barcoder.scrud.post.presentation;

import com.barcoder.scrud.api.PostApi;
import com.barcoder.scrud.global.common.util.SecurityUtil;
import com.barcoder.scrud.model.CreatePostRequest;
import com.barcoder.scrud.model.CreatePostResponse;
import com.barcoder.scrud.model.GetPostListResponse;
import com.barcoder.scrud.model.PageDto;
import com.barcoder.scrud.model.PostDetailResponse;
import com.barcoder.scrud.model.PostOrderEnumDto;
import com.barcoder.scrud.model.PostSortEnumDto;
import com.barcoder.scrud.model.PostSummaryResponse;
import com.barcoder.scrud.model.PostVoteRequest;
import com.barcoder.scrud.model.SearchTypeEnumDto;
import com.barcoder.scrud.model.UpdatePostRequest;
import com.barcoder.scrud.model.UserResponse;
import com.barcoder.scrud.model.VoteResponse;
import com.barcoder.scrud.post.application.dto.in.CreatePostIn;
import com.barcoder.scrud.post.application.dto.in.GetPostListIn;
import com.barcoder.scrud.post.application.dto.in.PostVoteIn;
import com.barcoder.scrud.post.application.dto.in.UpdatePostIn;
import com.barcoder.scrud.post.application.dto.out.CreatePostOut;
import com.barcoder.scrud.post.application.dto.out.GetPostOut;
import com.barcoder.scrud.post.application.dto.out.PostListOut;
import com.barcoder.scrud.post.application.dto.out.PostVoteOut;
import com.barcoder.scrud.post.application.facade.PostGetFacade;
import com.barcoder.scrud.post.application.service.PostGetService;
import com.barcoder.scrud.post.application.service.PostService;
import com.barcoder.scrud.post.domain.enums.PostOrder;
import com.barcoder.scrud.post.domain.enums.PostSearchType;
import com.barcoder.scrud.post.domain.enums.PostSort;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@Slf4j
public class PostController implements PostApi {

    private final ModelMapper modelMapper;
    private final PostService postService;
    private final PostGetService postGetService;
    private final PostGetFacade postGetFacade;
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

        // 게시글 상세 조회
        GetPostOut outDto = postGetFacade.getPostById(postId);

        // author 변환
        UserResponse author = modelMapper.map(outDto.getAuthor(), UserResponse.class);

        // post 변환
        PostDetailResponse response = modelMapper.map(outDto.getPost(), PostDetailResponse.class);

        // response 카테고리
        response.setCategory(outDto.getPost().getCategory().getName());

        // response author
        response.setAuthor(author);

        return ResponseEntity.ok(response);
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
    public ResponseEntity<GetPostListResponse> getPostList(Integer page, Integer size, PostSortEnumDto sort, PostOrderEnumDto order, String keyword, SearchTypeEnumDto type, Long categoryId) {

        // inDto 생성
        GetPostListIn inDto = GetPostListIn.builder()
                .page(page)
                .size(size)
                .sort(modelMapper.map(sort, PostSort.class))
                .order(modelMapper.map(order, PostOrder.class))
                .keyword(keyword)
                .type(modelMapper.map(type, PostSearchType.class))
                .categoryId(categoryId)
                .build();

        // 게시글 목록 조회
        PostListOut outDto = postGetService.getPostList(inDto);

        // pageDto 변환
        PageDto pageDto = modelMapper.map(outDto, PageDto.class);

        // content 변환
        List<PostSummaryResponse> postResponseList = outDto.getContent().stream()
                .map(post -> {
                    PostSummaryResponse postSummaryResponse = modelMapper.map(post, PostSummaryResponse.class);
                    postSummaryResponse.setCategory(post.getCategory().getName());
                    return postSummaryResponse;
                })
                .toList();

        //response 변환
        GetPostListResponse response = GetPostListResponse.builder()
                .pageable(pageDto)
                .content(postResponseList)
                .build();

        return ResponseEntity.ok(response);
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

        // inDto 생성
        UpdatePostIn inDto = modelMapper.map(updatePostRequest, UpdatePostIn.class).toBuilder()
                .postId(postId)
                .build();

        // 게시글 수정
        postService.updatePost(inDto);

        return ResponseEntity.ok().build();
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

        // userId 조회
        UUID userId = securityUtil.getCurrentUserId();

        // inDto 생성
        PostVoteIn inDto = PostVoteIn.builder()
                .postId(postId)
                .userId(userId)
                .isLike(postVoteRequest.getIsLike())
                .build();

        // 추천, 비추천
        PostVoteOut outDto = postService.votePost(inDto);

        // response 변환
        VoteResponse response = modelMapper.map(outDto, VoteResponse.class);

        return ResponseEntity.ok(response);
    }

}
