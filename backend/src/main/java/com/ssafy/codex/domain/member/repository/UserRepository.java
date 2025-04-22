package com.ssafy.codex.domain.member.repository;

import com.ssafy.codex.domain.member.model.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {
    Optional<User> findByUsername(String email);

    Optional<User> findByUserId(UUID userId);
}
