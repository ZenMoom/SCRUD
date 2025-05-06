package com.barcoder.scrud.user.infrastructure.repository;

import com.barcoder.scrud.user.domain.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByUsername(String email);

    Optional<User> findByUserId(UUID userId);

    // 테스트용
    Optional<User> findFirstByOrderByUserId();
}
