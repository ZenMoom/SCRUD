package com.barcoder.scrud.oauth;

import com.barcoder.scrud.user.domain.entity.User;
import lombok.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.*;

@Slf4j
@Getter
@Builder
@ToString
@AllArgsConstructor
/*
    Spring Security 에서 인증된 사용자의 정보를 담는 클래스
*/
public class UserPrincipal implements OAuth2User, UserDetails {
    private final UUID userId;
    private final String username;
    private final String nickname;
    private final Collection<? extends GrantedAuthority> authorities;
    private final String provider;

    @Setter
    private Map<String, Object> attributes;

    public static UserPrincipal create(User user) {
        List<GrantedAuthority> authorities = Collections.
                singletonList(new SimpleGrantedAuthority("ROLE_USER"));

        return new UserPrincipal(
                user.getUserId(),
                user.getUsername(),
                user.getUsername(),
                authorities,
                null,
                null
        );
    }

    public static UserPrincipal create(User user, Map<String, Object> attributes) {
        // attributes에서 provider 정보를 추출하여 판단
        String provider = determineProvider(attributes);

        log.info("provider: {}", provider);

        return UserPrincipal.builder()
            .userId(user.getUserId())
            .username(user.getUsername())
            .nickname(user.getNickname())
            .authorities(Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER")))
            .provider(provider)
            .build();
    }

    /**
     * attributes 맵을 분석하여 OAuth 제공자를 결정하는 메소드
     */
    private static String determineProvider(Map<String, Object> attributes) {
        // Google 특유의 attributes 키 확인
        if (attributes.containsKey("sub") && attributes.containsKey("email_verified")) {
            return "google";
        }

        // GitHub 특유의 attributes 키 확인
        if (attributes.containsKey("login") && attributes.containsKey("node_id")) {
            return "github";
        }

        return "unknown";
    }

    @Override
    public String getPassword() { return ""; }

    @Override
    public String getUsername() {
        return username;
    }

    @Override
    public String getName() { return nickname; }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}
