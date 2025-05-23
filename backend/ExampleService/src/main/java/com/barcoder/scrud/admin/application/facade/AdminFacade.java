package com.barcoder.scrud.admin.application.facade;

import com.barcoder.scrud.admin.application.dto.out.ApiPromptListOutDto;
import com.barcoder.scrud.admin.application.dto.out.ApiPromptOut;
import com.barcoder.scrud.admin.application.service.ApiPromptService;
import com.barcoder.scrud.global.common.error.ErrorStatus;
import com.barcoder.scrud.global.common.exception.ExceptionHandler;
import com.barcoder.scrud.user.application.dto.out.UserOut;
import com.barcoder.scrud.user.application.usecase.UserUseCase;
import com.barcoder.scrud.user.domain.enums.UserRole;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
public class AdminFacade {

    private final UserUseCase userUseCase;
    private final ApiPromptService apiPromptService;

    @Transactional(readOnly = true)
    public ApiPromptOut getApiPromptDetail(Long apiPromptId, UUID userId) {
        // 유저 확인
        UserOut userOut = userUseCase.getUserById(userId);

        // 유저 권한 확인
        if (!userOut.getRole().equals(UserRole.ADMIN)) {
            throw new ExceptionHandler(ErrorStatus.USER_NOT_ADMIN);
        }

        // apiPrompt 정보 조회
        return apiPromptService.getApiPromptDetail(apiPromptId).toBuilder()
                .user(userOut)
                .build();
    }

    @Transactional(readOnly = true)
    public ApiPromptListOutDto getApiPromptList(UUID userId) {
        // 유저 정보 조회
        UserOut userOut = userUseCase.getUserById(userId);
        // 유저 권한 확인
        if (!userOut.getRole().equals(UserRole.ADMIN)) {
            throw new ExceptionHandler(ErrorStatus.USER_NOT_ADMIN);
        }
        // apiPrompt 리스트 조회
        ApiPromptListOutDto apiPromptList = apiPromptService.getApiPromptList();
        // apiPrompt 리스트에 유저 정보 추가
        List<ApiPromptOut> apiPromptOutList = apiPromptList.getContent().stream()
                .map(apiPromptOut -> apiPromptOut.toBuilder()
                        .user(userOut)
                        .build())
                .toList();
        // apiPrompt 리스트 반환
        return ApiPromptListOutDto.builder()
                .content(apiPromptOutList)
                .build();
    }
}
