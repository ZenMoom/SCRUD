package com.ssafy.codex.domain.oauth.service;

import com.ssafy.codex.domain.member.model.entity.User;
import com.ssafy.codex.domain.member.repository.UserRepository;
import com.ssafy.codex.domain.oauth.UserPrincipal;
import com.ssafy.codex.domain.oauth.provider.GoogleOAuth2UserInfo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.InternalAuthenticationServiceException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.Optional;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class CustomOAuth2UserService extends DefaultOAuth2UserService {
    // http://localhost:8080/oauth2/authorization/google

    private final UserRepository userRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest oAuth2UserRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(oAuth2UserRequest);
        log.info("loadUser: {}", oAuth2User);
        try {
            return processOAuth2User(oAuth2User);
        } catch (AuthenticationException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new InternalAuthenticationServiceException(ex.getMessage(), ex.getCause());
        }
    }

    // 구글에서 받아온 정보를 DB 에 저장
    private OAuth2User processOAuth2User(OAuth2User oAuth2User) {
        log.info("processOAuth2User: {}", oAuth2User);
        Map<String, Object> attributes = oAuth2User.getAttributes();

        GoogleOAuth2UserInfo googleOAuth2UserInfo = new GoogleOAuth2UserInfo(attributes);

        // 기존 회원 조회
        Optional<User> optionalUser =  userRepository.findByUsername(googleOAuth2UserInfo.getEmail());

        User user;

        // 신규 회원 가입, 기존 회원 업데이트
         user = optionalUser
                .map(value -> updateUser(value, googleOAuth2UserInfo))
                .orElseGet(() -> register(googleOAuth2UserInfo));

        return UserPrincipal.create( user, attributes);
    }

    // 사용자 DB 저장
    private User register(GoogleOAuth2UserInfo oAuth2UserInfo) {
        log.info("register: {}", oAuth2UserInfo);
        String username = oAuth2UserInfo.getEmail();
        String profileUrl = oAuth2UserInfo.getImageUrl();

        User user = new User(username, profileUrl);
        return userRepository.save(user);
    }

    private User updateUser(User existingUser, GoogleOAuth2UserInfo oAuth2UserInfo) {
        log.info("updateUser: {}", existingUser);
        if(!existingUser.getProfileImgUrl().equals(oAuth2UserInfo.getImageUrl())) {
            existingUser.updateProfileImgUrl(oAuth2UserInfo.getImageUrl());
        }
        return  userRepository.save(existingUser);
    }
}
