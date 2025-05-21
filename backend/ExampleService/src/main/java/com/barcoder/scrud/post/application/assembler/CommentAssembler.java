package com.barcoder.scrud.post.application.assembler;

import com.barcoder.scrud.post.application.dto.in.CreateCommentCommand;
import com.barcoder.scrud.post.domain.entity.Comment;
import com.barcoder.scrud.post.domain.entity.CommentVote;
import com.barcoder.scrud.post.infrastructure.event.CommentVoteEvent;
import org.springframework.stereotype.Component;

@Component
public class CommentAssembler {

    public Comment toCommentEntity(CreateCommentCommand command) {
        return Comment.builder()
                .userId(command.getUserId())
                .content(command.getContent())
                .post(command.getPost())
                .parentComment(command.getParentComment())
                .build();
    }

    public CommentVote toCommentVoteEntity(CommentVoteEvent event) {
        return CommentVote.builder()
                .userId(event.getUserId())
                .isLike(event.getIsLike())
                .build();
    }
}
