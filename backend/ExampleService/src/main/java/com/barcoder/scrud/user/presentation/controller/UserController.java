package com.barcoder.scrud.user.presentation.controller;

import com.barcoder.scrud.api.UserApi;
import com.barcoder.scrud.global.common.error.ErrorStatus;
import com.barcoder.scrud.global.common.exception.ExceptionHandler;
import com.barcoder.scrud.global.common.util.SecurityUtil;
import com.barcoder.scrud.model.UserResponse;
import com.barcoder.scrud.user.domain.entity.User;
import com.barcoder.scrud.user.infrastructure.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@Slf4j
@RestController
@RequiredArgsConstructor
public class UserController implements UserApi {

    private final SecurityUtil securityUtil;
    private final UserRepository userRepository;


    /**
     * GET /api/v1/users/me : 현재 로그인한 사용자의 정보를 조회합니다.
     *
     * @return UserResponse 사용자 정보 (status code 200)
     */
    @Override
    public ResponseEntity<UserResponse> getCurrentUser() {

        UUID userId = securityUtil.getCurrentUserId();

        log.info("getCurrentUser userId = " + userId);

        User user = userRepository.findByUserId(userId)
                .orElseThrow(() -> new ExceptionHandler(ErrorStatus.USER_NOT_FOUND));

        log.info("getCurrentUser user = {}", user.toString());

        UserResponse response = UserResponse.builder()
                .userId(user.getUserId())
                .nickname(user.getNickname())
                .openAiApiKey(user.getOpenAiApiKey())
                .build();

        return ResponseEntity.ok(response);
    }

    /**
     * PATCH /api/v1/OpenAI : 사용자 OpenAI Key 받아오기
     *
     * @param body (optional)
     * @return Void 성공적으로 처리되었습니다 (status code 200)
     */
    @Override
    public ResponseEntity<Void> updateOpenAIAPiKey(String body) {
        UUID userId = securityUtil.getCurrentUserId();

        log.info("updateOpenAIAPiKey userId = " + userId);

        User user = userRepository.findByUserId(userId).
                orElseThrow(() -> new ExceptionHandler(ErrorStatus.USER_NOT_FOUND));

        log.info("updateOpenAIAPiKey user = {}" + user.toString());

        user.updateOpenaiApiKey(body);
        userRepository.save(user);

        log.info(user.getOpenAiApiKey());

        return ResponseEntity.ok().build();
    }
}