package com.barcoder.scrud.github.domain.entity;

import com.barcoder.scrud.user.domain.entity.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name="github_account")
public class GithubAccount {
    @Id
    @Column(name="github_account_id")
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long githubAccountId;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(unique = true)
    private String githubUserId;

    private String accessToken;

    public void updateAccessToken(String accessToken) {
        this.accessToken = accessToken;
    }
}