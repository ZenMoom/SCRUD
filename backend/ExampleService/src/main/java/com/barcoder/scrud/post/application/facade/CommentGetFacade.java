package com.barcoder.scrud.post.application.facade;

import com.barcoder.scrud.global.common.exception.BaseException;
import com.barcoder.scrud.post.application.dto.out.CommentOut;
import com.barcoder.scrud.post.domain.entity.Comment;
import com.barcoder.scrud.post.domain.entity.Post;
import com.barcoder.scrud.post.domain.exception.PostErrorStatus;
import com.barcoder.scrud.post.infrastructure.jpa.PostJpaRepository;
import com.barcoder.scrud.user.application.dto.out.UserOut;
import com.barcoder.scrud.user.application.usecase.UserUseCase;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class CommentGetFacade {

    private final PostJpaRepository postJpaRepository;
    private final UserUseCase userUseCase;
    private final ModelMapper modelMapper;

    public List<CommentOut> getCommentList(Long postId) {

        // 게시글 조회
        Post post = postJpaRepository.findById(postId)
                .orElseThrow(() -> new BaseException(PostErrorStatus.POST_NOT_FOUND));

        // 댓글 리스트 조회
        List<Comment> allComents = post.getComments();

        // 댓글이 없는 경우
        if (allComents.isEmpty()){
            return List.of();
        }

        // userId 리스트 생성
        Set<UUID> userIdList = allComents.stream()
                .map(Comment::getUserId)
                .collect(Collectors.toSet());
        
        // userOut 조회
        for (UUID uuid : userIdList) {
            userUseCase.getUserById(uuid);
        }

        // commentOut 리스트 생성
        List<CommentOut> content = allComents.stream()
                .map(comment -> {

                    // userOut 조회
                    UserOut userOut = userUseCase.getUserById(comment.getUserId());

                    // parentCommentId가 null인 경우
                    Long parentCommentId = comment.getParentComment().getCommentId() == null ? null : comment.getParentComment().getCommentId();

                    // commentOut 생성
                    return modelMapper.map(comment, CommentOut.class).toBuilder()
                            .parentCommentId(parentCommentId)
                            .author(userOut)
                            .build();
                })
                .toList();

        // outDto 생성
        return content;
    }
}
