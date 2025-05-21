package com.barcoder.scrud.github.infrastructure.repository;

import com.barcoder.scrud.github.domain.entity.GithubAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface GithubAccountRepository extends JpaRepository<GithubAccount, Long> {
    Optional<GithubAccount> findByGithubUserId(String githubUserId);
}
