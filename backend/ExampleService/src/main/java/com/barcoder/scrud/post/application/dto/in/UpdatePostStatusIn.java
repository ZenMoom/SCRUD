package com.barcoder.scrud.post.application.dto.in;

import com.barcoder.scrud.post.domain.enums.PostStatus;
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
public class UpdatePostStatusIn {

    private UUID userId;
    private Long postId;
    private PostStatus status;
}
