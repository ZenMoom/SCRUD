package com.barcoder.scrud.post.domain.entity;

import com.barcoder.scrud.global.common.baseentity.BaseTimeEntity;
import com.barcoder.scrud.global.config.generator.SnowflakeId;
import com.barcoder.scrud.post.domain.enums.PostStatus;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "post")
@Builder
@Getter
@AllArgsConstructor(access = lombok.AccessLevel.PRIVATE)
@NoArgsConstructor(access = lombok.AccessLevel.PROTECTED)
public class Post extends BaseTimeEntity {

    @Id
    @SnowflakeId
    private Long postId;

    private UUID userId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @Column(nullable = false, columnDefinition = "VARCHAR(255)")
    private String title;

    @Column(nullable = false, columnDefinition = "LONGTEXT")
    private String content;

    @Column(nullable = false)
    @Builder.Default
    private Long viewCount = 0L;

    @Column(nullable = false)
    @Builder.Default
    private Long likeCount = 0L;

    @Column(nullable = false)
    @Builder.Default
    private Long dislikeCount = 0L;

    @Column(nullable = false)
    @Builder.Default
    private Long commentCount = 0L;

    @Column(nullable = false)
    @Builder.Default
    @Enumerated(EnumType.STRING)
    private PostStatus status = PostStatus.PENDING;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isUpdated = false;

    @JsonIgnore
    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Comment> comments = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PostVote> postVotes = new ArrayList<>();

    // 조회수 증가
    public void addPostViewCount() {
        this.viewCount++;
    }

    // 댓글 수 증가
    public void addCommentCount() {
        this.commentCount++;
    }

    // 제목 변경
    public void updateTitle(String title) {
        this.title = title;
        this.isUpdated = true;
    }

    // 내용 변경
    public void updateContent(String content) {
        this.content = content;
        this.isUpdated = true;
    }

    // 이미 추천했는지 확인
    public boolean isAlreadyVoted(UUID userId) {
        for (PostVote postVote : this.postVotes) {
            if (postVote.aleadyVote(userId)) {
                return true;
            }
        }
        return false;
    }

    // 좋아요, 싫어요 수 증가
    public void addPostVoteCount(PostVote postVote) {

        postVote.addPost(this);
        this.postVotes.add(postVote);

        if (postVote.getIsLike()) {
            this.likeCount++;
        } else {
            this.dislikeCount++;
        }
    }

    // 상태 변경
    public void changeStatus(PostStatus status) {
        this.status = status;
    }
}
