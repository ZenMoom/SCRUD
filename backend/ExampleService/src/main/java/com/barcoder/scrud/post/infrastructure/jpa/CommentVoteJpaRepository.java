package com.barcoder.scrud.post.infrastructure.jpa;

import com.barcoder.scrud.post.domain.entity.CommentVote;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CommentVoteJpaRepository extends JpaRepository<CommentVote, Long> {

	List<CommentVote> findByUserIdAndComment_CommentIdIn(UUID userId, List<Long> commentIds);

	List<CommentVote> findAllByComment_CommentIdIn(List<Long> commentIds);
}
