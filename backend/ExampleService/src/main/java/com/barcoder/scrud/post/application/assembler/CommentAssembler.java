package com.barcoder.scrud.post.application.assembler;

import com.barcoder.scrud.post.application.dto.in.CreateCommentCommand;
import com.barcoder.scrud.post.domain.entity.Comment;
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
}
