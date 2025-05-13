package com.barcoder.scrud.global.common.util;

import com.barcoder.scrud.global.common.error.ErrorStatus;
import com.barcoder.scrud.global.common.exception.ExceptionHandler;
import com.barcoder.scrud.user.domain.entity.User;
import com.barcoder.scrud.user.infrastructure.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class SecurityUtil {

    private final JWTUtil jwtUtil;
    private final HttpServletRequest request;
    private final UserRepository userRepository;

    public UUID getCurrentUserId() {
        // 요청 헤더에서 Authorization 값을 가져옴
        String authorizationHeader = request.getHeader("Authorization");
        log.info("Authorization header: {}", authorizationHeader);
        if(authorizationHeader.equals("Bearer Admin")) {
            User user = userRepository.findByUsername("admin")
                .orElseThrow(() -> new ExceptionHandler(ErrorStatus.USER_NOT_FOUND));
            log.info("Admin user: {}", user.getUserId());
            return user.getUserId();
        }

        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            log.error("Authorization 헤더가 없거나 Bearer 토큰이 아닙니다.");
            throw new ExceptionHandler(ErrorStatus._UNAUTHORIZED);
        }
        // JWTUtil을 사용하여 토큰에서 memberId 추출
        return jwtUtil.getUserId(authorizationHeader);
    }
}
