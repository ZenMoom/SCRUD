package com.barcoder.scrud.scrudproject.repository;

import com.barcoder.scrud.scrudproject.domain.entity.ScrudProject;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ScrudProjectRepository extends JpaRepository<ScrudProject, Long> {
    List<ScrudProject> findScrudProjectsByUserIdAndIsDeletedIsFalseOrderByUpdatedAtDesc(Pageable pageable, UUID userId);

    Optional<ScrudProject> findByScrudProjectIdAndUserId(Long projectId, UUID userId);
}
