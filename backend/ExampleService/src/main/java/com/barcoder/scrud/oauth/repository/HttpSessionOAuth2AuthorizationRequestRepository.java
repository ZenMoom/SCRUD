package com.barcoder.scrud.oauth.repository;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.client.web.AuthorizationRequestRepository;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Slf4j
@Component
public class HttpSessionOAuth2AuthorizationRequestRepository 
    implements AuthorizationRequestRepository<OAuth2AuthorizationRequest> {

    public static final String OAUTH2_AUTHORIZATION_REQUEST_KEY = "OAUTH2_AUTHORIZATION_REQUEST";
    public static final String REDIRECT_URI_KEY = "OAUTH2_REDIRECT_URI";

    @Override
    public OAuth2AuthorizationRequest loadAuthorizationRequest(HttpServletRequest request) {

        log.info("loadAuthorizationRequest 호출");

        HttpSession session = request.getSession(false);
        if (session != null) {

            log.info(session.getAttribute(OAUTH2_AUTHORIZATION_REQUEST_KEY).toString());
            return (OAuth2AuthorizationRequest) session.getAttribute(OAUTH2_AUTHORIZATION_REQUEST_KEY);
        }
        return null;
    }

    @Override
    public void saveAuthorizationRequest(OAuth2AuthorizationRequest authorizationRequest, 
                                        HttpServletRequest request, HttpServletResponse response) {
        if (authorizationRequest == null) {
            removeAuthorizationRequest(request, response);
            return;
        }

        HttpSession session = request.getSession();
        session.setAttribute(OAUTH2_AUTHORIZATION_REQUEST_KEY, authorizationRequest);

        // 리다이렉트 URI 저장 (쿼리 파라미터에서)
        String redirectUri = request.getParameter(REDIRECT_URI_KEY);
        if (StringUtils.hasText(redirectUri)) {
            session.setAttribute(REDIRECT_URI_KEY, redirectUri);
        }
    }

    @Override
    public OAuth2AuthorizationRequest removeAuthorizationRequest(HttpServletRequest request, 
                                                                HttpServletResponse response) {
        OAuth2AuthorizationRequest authRequest = loadAuthorizationRequest(request);
        if (authRequest != null) {
            HttpSession session = request.getSession();
            session.removeAttribute(OAUTH2_AUTHORIZATION_REQUEST_KEY);
        }
        return authRequest;
    }

    /**
    * 세션에서 리다이렉트 URI 가져와서 삭제
    */
    public String removeRedirectUri(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            String redirectUri = (String) session.getAttribute(REDIRECT_URI_KEY);
            if (redirectUri != null) {
                session.removeAttribute(REDIRECT_URI_KEY);
            }
            return redirectUri;
        }
        return null;
    }
}