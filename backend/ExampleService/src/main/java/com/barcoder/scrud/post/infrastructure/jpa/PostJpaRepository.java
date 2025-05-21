package com.barcoder.scrud.post.infrastructure.jpa;

import com.barcoder.scrud.post.domain.entity.Post;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PostJpaRepository extends JpaRepository<Post, Long> {
}
