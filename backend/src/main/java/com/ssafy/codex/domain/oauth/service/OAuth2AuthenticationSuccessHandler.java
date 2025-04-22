package com.ssafy.codex.domain.oauth.service;

import com.ssafy.codex.base.status.ErrorStatus;
import com.ssafy.codex.domain.member.model.entity.Token;
import com.ssafy.codex.domain.member.model.entity.User;
import com.ssafy.codex.domain.member.repository.UserRepository;
import com.ssafy.codex.domain.oauth.UserPrincipal;
import com.ssafy.codex.exception.ExceptionHandler;
import com.ssafy.codex.util.JWTUtil;
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
            .orElseThrow(() -> new ExceptionHandler(ErrorStatus.MEMBER_NOT_FOUND));

        // 토큰 생성
        Token jwtToken = jwtUtil.createAccessToken(user);
        log.info("jwtToken: {}", jwtToken);

        response.setHeader("Authorization", "Bearer " + jwtToken.getAccessToken());

        String redirectUri = environment.getProperty("oauth2.frontRedirectUri") == null ?
            "http://localhost:3000" : environment.getProperty("oauth2.frontRedirectUri");

        // 토큰과 사용자 정보를 함께 전달
        // URL 파라미터 인코딩
        String redirectUrl = UriComponentsBuilder.fromUriString(redirectUri)
            .queryParam("token", jwtToken.getAccessToken())
            .queryParam("loginId", user.getUsername())
            .queryParam("profileImg", user.getProfileImgUrl() != null ? user.getProfileImgUrl() : "")
            .build()
            .encode()  // 한 번만 인코딩
            .toUriString();

        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }
}
