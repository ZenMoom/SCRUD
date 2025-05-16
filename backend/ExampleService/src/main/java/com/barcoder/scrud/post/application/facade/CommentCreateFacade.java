package com.barcoder.scrud.post.application.facade;

import com.barcoder.scrud.global.common.exception.BaseException;
import com.barcoder.scrud.post.application.dto.in.CreateCommentCommand;
import com.barcoder.scrud.post.application.dto.in.CreateCommentIn;
import com.barcoder.scrud.post.application.service.CommentService;
import com.barcoder.scrud.post.domain.entity.Comment;
import com.barcoder.scrud.post.domain.entity.Post;
import com.barcoder.scrud.post.domain.exception.PostErrorStatus;
import com.barcoder.scrud.post.infrastructure.jpa.CommentJpaRepository;
import com.barcoder.scrud.post.infrastructure.jpa.PostJpaRepository;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class CommentCreateFacade {

    private final PostJpaRepository postJpaRepository;
    private final CommentJpaRepository commentJpaRepository;
    private final CommentService commentService;
    private final ModelMapper modelMapper;

    /**
     * 댓글 생성
     *
     * @param inDto 댓글 생성 요청 DTO
     */
    public void createComment(CreateCommentIn inDto) {

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
        commentService.createComment(command);
    }
}
