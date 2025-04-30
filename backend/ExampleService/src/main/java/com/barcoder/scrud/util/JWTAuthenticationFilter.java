package com.barcoder.scrud.util;

import com.barcoder.scrud.base.status.ErrorStatus;
import com.barcoder.scrud.domain.user.model.entity.User;
import com.barcoder.scrud.domain.user.repository.UserRepository;
import com.barcoder.scrud.domain.oauth.UserPrincipal;
import com.barcoder.scrud.exception.ExceptionHandler;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class JWTAuthenticationFilter extends OncePerRequestFilter {

    private final JWTUtil jwtUtil;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String authorization = request.getHeader("Authorization");

        if (authorization == null || !authorization.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            // 토큰 검증
            jwtUtil.checkTokenValidation(authorization);

            // 사용자 정보 가져오기
            UUID userId = jwtUtil.getUserId(authorization);
            User user = userRepository.findByUserId(userId)
                    .orElseThrow(() -> new ExceptionHandler(ErrorStatus.USER_NOT_FOUND));

            // SecurityContext에 인증 정보 설정
            UserPrincipal principal = UserPrincipal.create(user);
            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());

            SecurityContextHolder.getContext().setAuthentication(authentication);
        } catch (Exception e) {
            // 인증 실패 시 처리할 내용
            // 에러 로깅만 하고 필터 체인은 계속 진행
            log.error("JWT 인증 실패: {}", e.getMessage());
        }

        filterChain.doFilter(request, response);
    }
}