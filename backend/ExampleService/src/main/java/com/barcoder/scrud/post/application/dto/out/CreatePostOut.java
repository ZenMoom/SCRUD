package com.barcoder.scrud.post.application.dto.out;

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
public class CreatePostOut {

    private Long postId;
    private UUID userId;
    private String title;
    private String content;
    private Long categoryId;
    private Long viewCount;
    private Long likeCount;
    private Long dislikeCount;
}


