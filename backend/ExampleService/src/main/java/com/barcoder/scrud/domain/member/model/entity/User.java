package com.barcoder.scrud.domain.member.model.entity;

import com.barcoder.scrud.base.BaseEntity;
import com.barcoder.scrud.domain.github.model.entity.GithubAccount;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Comment;

import java.util.UUID;

@Entity
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "Users")
public class User extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "username", unique = true, nullable = false)
    // "Google OAuth 로 받아온 이메일이 로그인 아이디"
    @Comment("사용자 로그인 아이디")
    private String username;

    @Column(name="nickname")
    private String nickname;

    @Column(name = "profile_img_url", nullable = true)
    @Comment("프로필 이미지")
    private String profileImgUrl;

    @Column(name = "is_github_connected")
    private boolean isGithubConnected;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private GithubAccount githubAccount;

    public User(String username, String profileUrl, String nickname) {
        this.username = username;
        this.profileImgUrl = profileUrl;
        this.nickname = nickname;
    }

    public void updateProfileImgUrl(String profileUrl) {
        this.profileImgUrl = profileUrl;
    }

    public void updateGithubConnection(boolean isConnected) {
        this.isGithubConnected = isConnected;
    }

    public void updateUserId(UUID userId) {
        this.userId = userId;
    }
}