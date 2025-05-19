package com.barcoder.scrud.post.application.facade;

import com.barcoder.scrud.global.common.exception.BaseException;
import com.barcoder.scrud.post.application.dto.in.CreateCommentCommand;
import com.barcoder.scrud.post.application.dto.in.CreateCommentIn;
import com.barcoder.scrud.post.application.dto.in.UpdateCommentIn;
import com.barcoder.scrud.post.application.dto.out.CommentOut;
import com.barcoder.scrud.post.application.service.CommentService;
import com.barcoder.scrud.post.domain.entity.Comment;
import com.barcoder.scrud.post.domain.entity.Post;
import com.barcoder.scrud.post.domain.exception.PostErrorStatus;
import com.barcoder.scrud.post.infrastructure.jpa.CommentJpaRepository;
import com.barcoder.scrud.post.infrastructure.jpa.PostJpaRepository;
import com.barcoder.scrud.user.application.dto.out.UserOut;
import com.barcoder.scrud.user.application.service.UserService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class CommentFacade {

    private final PostJpaRepository postJpaRepository;
    private final CommentJpaRepository commentJpaRepository;
    private final UserService userService;
    private final CommentService commentService;
    private final ModelMapper modelMapper;

    /**
     * 댓글 생성
     *
     * @param inDto 댓글 생성 요청 DTO
     */
    public CommentOut createComment(CreateCommentIn inDto) {

        // 게시글 조회
        Post post = postJpaRepository.findById(inDto.getPostId())
                .orElseThrow(() -> new BaseException(PostErrorStatus.POST_NOT_FOUND));

        // 부모 댓글 조회
        Comment parentComment = null;
        if (inDto.getParentCommentId() != null) {
            parentComment = commentJpaRepository.findById(inDto.getParentCommentId())
                    .orElseThrow(() -> new BaseException(PostErrorStatus.COMMENT_NOT_FOUND));
        }

        // command dto 생성
        CreateCommentCommand command = modelMapper.map(inDto, CreateCommentCommand.class).toBuilder()
                .post(post)
                .parentComment(parentComment)
                .build();

        // 댓글 생성
        CommentOut outDto = commentService.createComment(command);

        // 유저 정보 조회
        UserOut userOut = userService.getUserById(inDto.getUserId());

        // post의 commentCount 증가
        post.addCommentCount();

        return outDto.toBuilder()
                .author(userOut)
                .build();
    }

    /**
     * 댓글 삭제
     *
     * @param commentId 댓글 ID
     * @param userId    유저 ID
     */
    public void deleteComment(Long commentId, UUID userId) {
        // 댓글 조회
        Comment comment = commentJpaRepository.findById(commentId)
                .orElseThrow(() -> new BaseException(PostErrorStatus.COMMENT_NOT_FOUND));

        // 댓글 작성자와 현재 유저가 같은지 확인
        if (!comment.getUserId().equals(userId)) {
            throw new BaseException(PostErrorStatus.COMMENT_NOT_AUTHORIZED);
        }

        // 댓글 삭제
        comment.delete();
    }

    /**
     * 댓글 수정
     *
     * @param inDto 댓글 수정 요청 DTO
     */
    public void updateComment(UpdateCommentIn inDto) {

        // 댓글 조회
        Comment comment = commentJpaRepository.findById(inDto.getCommentId())
                .orElseThrow(() -> new BaseException(PostErrorStatus.COMMENT_NOT_FOUND));

        // 댓글 작성자와 현재 유저가 같은지 확인
        if (!comment.getUserId().equals(inDto.getUserId())) {
            throw new BaseException(PostErrorStatus.COMMENT_NOT_AUTHORIZED);
        }

        // 댓글 수정
        comment.update(inDto.getContent());
    }
}
