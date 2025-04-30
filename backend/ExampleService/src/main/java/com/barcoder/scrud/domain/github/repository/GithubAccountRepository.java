package com.barcoder.scrud.domain.github.repository;

import com.barcoder.scrud.domain.github.model.entity.GithubAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface GithubAccountRepository extends JpaRepository<GithubAccount, UUID> {
    Optional<GithubAccount> findByGithubUserId(String githubUserId);
}
