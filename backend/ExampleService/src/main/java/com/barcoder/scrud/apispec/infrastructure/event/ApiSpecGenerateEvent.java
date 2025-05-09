package com.barcoder.scrud.apispec.infrastructure.event;

import com.barcoder.scrud.scrudproject.domain.entity.ScrudProject;
import lombok.Builder;

@Builder(toBuilder = true)
public record ApiSpecGenerateEvent(ScrudProject scrudProject) {
}