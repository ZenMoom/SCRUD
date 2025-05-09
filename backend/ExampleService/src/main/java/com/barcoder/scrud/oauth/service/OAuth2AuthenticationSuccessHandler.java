package com.barcoder.scrud.oauth.service;

import com.barcoder.scrud.global.common.error.ErrorStatus;
import com.barcoder.scrud.global.common.exception.ExceptionHandler;
import com.barcoder.scrud.global.common.util.JWTUtil;
import com.barcoder.scrud.oauth.UserPrincipal;
import com.barcoder.scrud.oauth.repository.HttpSessionOAuth2AuthorizationRequestRepository;
import com.barcoder.scrud.user.domain.entity.Token;
import com.barcoder.scrud.user.domain.entity.User;
import com.barcoder.scrud.user.infrastructure.repository.UserRepository;
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

@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JWTUtil jwtUtil;
    private final Environment environment;
    private final UserRepository userRepository;
    private final HttpSessionOAuth2AuthorizationRequestRepository httpSessionRepository;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response, Authentication authentication)
        throws IOException {

        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();

        User user = userRepository.findByUsername(userPrincipal.getUsername())
            .orElseThrow(() -> new ExceptionHandler(ErrorStatus.USER_NOT_FOUND));

        String redirectUrl = null;
        String redirectUri = null;
        String token = null;

        switch(userPrincipal.getProvider()) {
            case "google":
                Token jwtToken = jwtUtil.createAccessToken(user);
                token = jwtToken.getAccessToken();

                response.setHeader("Authorization", "Bearer " + jwtToken.getAccessToken());

                redirectUri = environment.getProperty("oauth2.frontRedirectUri") == null ?
                    "http://localhost:3000" : environment.getProperty("oauth2.frontRedirectUri");

                break;

            case "github":
                token = user.getGithubAccount().getAccessToken();

                // 세션에서 저장된 리다이렉트 URI 가져오기
                redirectUri = httpSessionRepository.removeRedirectUri(request);

                // 리다이렉트 URI가 없으면 기본값 사용
                if (redirectUri == null || redirectUri.isEmpty()) {
                    redirectUri = environment.getProperty("oauth2.frontRedirectUri") == null ?
                        "http://localhost:3000" : environment.getProperty("oauth2.frontRedirectUri");
                }
                break;
        }

        log.info("token: {}",token);

        // 토큰과 사용자 정보를 함께 전달
        // URL 파라미터 인코딩
        redirectUrl = UriComponentsBuilder.fromUriString(redirectUri)
            .queryParam("token", token)
            .queryParam("loginId", user.getUsername())
            .queryParam("profileImg", user.getProfileImgUrl() != null ? user.getProfileImgUrl() : "")
            .build()
            .encode()  // 한 번만 인코딩
            .toUriString();

        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }
}
