package com.barcoder.scrud.oauth.controller;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

@Slf4j
@Controller
public class OAuth2Controller {

    private static final String REDIRECT_URI_SESSION_KEY = "OAUTH2_REDIRECT_URI";
    private static final String LOGIN_ID_SESSION_KEY = "OAUTH2_LOGIN_ID";

    // OAuth2 인증 시작 전에 리다이렉트 URI와 로그인 ID를 세션에 저장
    @GetMapping("/oauth2/authorize/{provider}")
    public String authorize(@PathVariable("provider") String provider,
                            @RequestParam(value = "redirect_uri", required = false) String redirectUri,
                            @RequestParam(value = "login_id", required = false) String loginId,
                            HttpServletRequest request) {

        // 리다이렉트 URI가 있으면 세션에 저장
        if (redirectUri != null && !redirectUri.isEmpty()) {
            request.getSession().setAttribute(REDIRECT_URI_SESSION_KEY, redirectUri);
        }

        // 로그인 ID가 있으면 세션에 저장
        if (loginId != null && !loginId.isEmpty()) {
            request.getSession().setAttribute(LOGIN_ID_SESSION_KEY, loginId);
        }

        // Spring Security OAuth2 로그인 엔드포인트로 리다이렉트
        return "redirect:/oauth2/authorization/" + provider;
    }
}