package com.barcoder.scrud.oauth.service;

import com.barcoder.scrud.global.common.error.ErrorStatus;
import com.barcoder.scrud.user.domain.entity.Token;
import com.barcoder.scrud.user.domain.entity.User;
import com.barcoder.scrud.user.infrastructure.repository.UserRepository;
import com.barcoder.scrud.oauth.UserPrincipal;
import com.barcoder.scrud.global.common.exception.ExceptionHandler;
import com.barcoder.scrud.global.common.util.JWTUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.env.Environment;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

@Component
@RequiredArgsConstructor
@Slf4j
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final JWTUtil jwtUtil;
    private final Environment environment;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response, Authentication authentication)
        throws IOException {

        log.info("onAuthenticationSuccess 호출");
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        User user = userRepository.findByUsername(userPrincipal.getUsername())
            .orElseThrow(() -> new ExceptionHandler(ErrorStatus.USER_NOT_FOUND));

        // 토큰 생성
        Token jwtToken = jwtUtil.createAccessToken(user);
        log.info("jwtToken: {}", jwtToken);

        response.setHeader("Authorization", "Bearer " + jwtToken.getAccessToken());

        String redirectUri = environment.getProperty("oauth2.frontRedirectUri") == null ?
            "http://localhost:3000" : environment.getProperty("oauth2.frontRedirectUri");

        // 토큰과 사용자 정보를 함께 전달
        // URL 파라미터 인코딩
        String redirectUrl = UriComponentsBuilder.fromUriString(redirectUri)
            .build()
            .encode()  // 한 번만 인코딩
            .toUriString();

        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }
}
