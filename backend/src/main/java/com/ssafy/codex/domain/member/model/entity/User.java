package com.ssafy.codex.domain.member.model.entity;

import com.ssafy.codex.base.BaseEntity;
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

    @Column(name = "profile_img_url", nullable = true)
    @Comment("프로필 이미지")
    private String profileImgUrl;

    public User(String username, String profileUrl) {
        this.username = username;
        this.profileImgUrl = profileUrl;
    }

    public void updateProfileImgUrl(String profileUrl) {
        this.profileImgUrl = profileUrl;
    }
}