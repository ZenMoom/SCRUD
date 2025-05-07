package com.barcoder.scrud.oauth.service;

import com.barcoder.scrud.github.domain.entity.GithubAccount;
import com.barcoder.scrud.github.infrastructure.repository.GithubAccountRepository;
import com.barcoder.scrud.global.common.error.ErrorStatus;
import com.barcoder.scrud.global.common.exception.ExceptionHandler;
import com.barcoder.scrud.oauth.UserPrincipal;
import com.barcoder.scrud.oauth.provider.GithubOAuth2UserInfo;
import com.barcoder.scrud.oauth.provider.GoogleOAuth2UserInfo;
import com.barcoder.scrud.user.application.assembler.UserAssembler;
import com.barcoder.scrud.user.domain.entity.User;
import com.barcoder.scrud.user.infrastructure.repository.UserRepository;
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
import java.util.UUID;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {
    
    // google oauth 
    // http://localhost:8080/oauth2/authorization/google
    
    // github oauth
    //  http://localhost:8080/oauth2/authorize/github?redirect_uri=https://www.naver.com

    // github repository 가져오기
    // https://api.github.com/user/repos

    private final UserRepository userRepository;
    private final UserAssembler userAssembler;
    private final GithubAccountRepository githubAccountRepository;

    @Override
    // 1. OAuth에서 넘어온 데이터 받기
    public OAuth2User loadUser(OAuth2UserRequest oAuth2UserRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(oAuth2UserRequest);
        log.info("loadUser: {}", oAuth2User);
        try {
            return processOAuth2User(oAuth2UserRequest, oAuth2User);
        } catch (AuthenticationException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new InternalAuthenticationServiceException(ex.getMessage(), ex.getCause());
        }
    }

    // 2. provider 에 따라 분기
    private OAuth2User processOAuth2User(OAuth2UserRequest oAuth2UserRequest, OAuth2User oAuth2User) {
        // 제공자 이름 추출 (github, google 등)
        String providerName = oAuth2UserRequest.getClientRegistration().getRegistrationId();

        if ("github".equals(providerName)) {
            // GitHub 인증 처리
            return processGitHubUser(oAuth2UserRequest, oAuth2User);
        } else if ("google".equals(providerName)) {
            // Google 인증 처리
            return processOAuth2User(oAuth2User);
        } else {
            throw new OAuth2AuthenticationException("Unsupported OAuth2 provider: " + providerName);
        }
    }

    // 3. 깃허브 유저 저장하기
    private OAuth2User processGitHubUser(OAuth2UserRequest oAuth2UserRequest, OAuth2User oAuth2User) {
        GithubOAuth2UserInfo githubOAuth2UserInfo = new GithubOAuth2UserInfo(oAuth2User.getAttributes());

        // GitHub 계정 연동
        GithubAccount githubAccount = processGitHubAccount(githubOAuth2UserInfo, oAuth2UserRequest);

        return UserPrincipal.create(githubAccount.getUser(), oAuth2User.getAttributes());
    }

    // 3. 구글에서 받아온 정보를 DB 에 저장
    private OAuth2User processOAuth2User(OAuth2User oAuth2User) {
        Map<String, Object> attributes = oAuth2User.getAttributes();

        GoogleOAuth2UserInfo googleOAuth2UserInfo = new GoogleOAuth2UserInfo(attributes);

        // 기존 회원 조회
        Optional<User> optionalUser =  userRepository.findByUsername(googleOAuth2UserInfo.getEmail());

        // 신규 회원 가입, 기존 회원 업데이트
        User user = optionalUser
                .map(value -> updateUser(value, googleOAuth2UserInfo))
                .orElseGet(() -> register(googleOAuth2UserInfo));

        return UserPrincipal.create(user, attributes);
    }

    // 4. 깃허브 유저 정보 저장
    private GithubAccount processGitHubAccount(GithubOAuth2UserInfo userInfo, OAuth2UserRequest request) {
        String accessToken = request.getAccessToken().getTokenValue();

        // 실제 코드
//        UUID userId = securityUtil.getCurrentUserId();

        // 테스트용 코드
        UUID userId = userRepository.findFirstByOrderByUserId().get().getUserId();

        User user = userRepository.findByUserId(userId).orElseThrow(() -> new ExceptionHandler(ErrorStatus.USER_NOT_FOUND));

        // GitHub 계정 조회 또는 생성 로직
        GithubAccount githubAccount = githubAccountRepository.findByGithubUserId(userInfo.getId())
            .orElseGet(() -> {
                // 새로운 GitHub 계정 생성
                GithubAccount newAccount = GithubAccount.builder()
                    .user(user)
                    .githubUserId(userInfo.getId())
                    .accessToken(accessToken)
                    .build();

                user.updateGithubConnection(true);

                return githubAccountRepository.save(newAccount);
            });

        // 액세스 토큰 업데이트
        githubAccount.updateAccessToken(accessToken);
        return githubAccountRepository.save(githubAccount);
    }

    // 4. 사용자 정보 저장
    private User register(GoogleOAuth2UserInfo oAuth2UserInfo) {
        User user = userAssembler.assemble(oAuth2UserInfo);
        return userRepository.save(user);
    }

    // 4. 사용자 정보 업데이트
    private User updateUser(User existingUser, GoogleOAuth2UserInfo oAuth2UserInfo) {
        if(!existingUser.getProfileImgUrl().equals(oAuth2UserInfo.getImageUrl())) {
            existingUser.updateProfileImgUrl(oAuth2UserInfo.getImageUrl());
        }
        return  userRepository.save(existingUser);
    }
}
