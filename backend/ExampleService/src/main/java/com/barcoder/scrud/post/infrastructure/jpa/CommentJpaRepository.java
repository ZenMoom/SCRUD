package com.barcoder.scrud.post.infrastructure.jpa;

import com.barcoder.scrud.post.domain.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CommentJpaRepository extends JpaRepository<Comment, Long> {
}
