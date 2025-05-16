package com.barcoder.scrud.post.application.service;

import com.barcoder.scrud.post.application.assembler.CommentAssembler;
import com.barcoder.scrud.post.application.dto.in.CreateCommentCommand;
import com.barcoder.scrud.post.domain.entity.Comment;
import com.barcoder.scrud.post.infrastructure.jpa.CommentJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
@RequiredArgsConstructor
public class CommentService {

    private final CommentAssembler commentAssembler;
    private final CommentJpaRepository commentJpaRepository;

    /**
     * 댓글 생성
     *
     * @param command 댓글 생성 요청 DTO
     */
    public void createComment(CreateCommentCommand command) {

        // entity 생성
        Comment comment = commentAssembler.toCommentEntity(command);

        // entity 저장
        commentJpaRepository.save(comment);
    }
}
