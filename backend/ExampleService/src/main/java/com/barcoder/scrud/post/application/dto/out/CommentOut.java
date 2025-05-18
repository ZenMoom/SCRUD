package com.barcoder.scrud.post.application.dto.out;

import com.barcoder.scrud.user.application.dto.out.UserOut;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder(toBuilder = true)
@AllArgsConstructor
@NoArgsConstructor
@ToString
public class CommentOut {

    private Long commentId;
    private Long postId;
    private String content;
    private Long parentCommentId;

    private Long likeCount;
    private Long dislikeCount;

    private Boolean isEdited;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private UserOut author;

}