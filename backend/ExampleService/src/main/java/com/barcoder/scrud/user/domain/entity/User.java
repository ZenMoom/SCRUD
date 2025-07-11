package com.barcoder.scrud.user.domain.entity;

import com.barcoder.scrud.global.common.baseentity.BaseTimeEntity;
import com.barcoder.scrud.github.domain.entity.GithubAccount;
import com.barcoder.scrud.user.domain.enums.UserRole;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Comment;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.UUID;

@Entity
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Table(name = "Users")
public class User extends BaseTimeEntity {
    @Id
    @JdbcTypeCode(SqlTypes.CHAR)
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "user_id")
    private UUID userId;

    // "Google OAuth 로 받아온 이메일이 로그인 아이디"
    @Column(name = "username", unique = true, nullable = false)
    @Comment("사용자 로그인 아이디")
    private String username;

    @Column(name="nickname")
    private String nickname;

    @Column(name = "profile_img_url", nullable = true)
    @Comment("프로필 이미지")
    private String profileImgUrl;

    @Column(name = "role", nullable = false)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private UserRole role = UserRole.USER;

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
}