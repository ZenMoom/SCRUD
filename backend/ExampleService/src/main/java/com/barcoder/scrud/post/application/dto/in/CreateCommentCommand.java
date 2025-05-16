package com.barcoder.scrud.post.application.dto.in;

import com.barcoder.scrud.post.domain.entity.Comment;
import com.barcoder.scrud.post.domain.entity.Post;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.util.UUID;

@Getter
@Builder(toBuilder = true)
@AllArgsConstructor
@NoArgsConstructor
@ToString
public class CreateCommentCommand {

    UUID userId;
    String content;
    Post post;
    Comment parentComment;
}
