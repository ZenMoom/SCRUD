package com.barcoder.scrud.oauth.provider;

import lombok.EqualsAndHashCode;

import java.util.Map;

@EqualsAndHashCode
public class GithubOAuth2UserInfo {

    private Map<String, Object> attributes;

    public GithubOAuth2UserInfo(Map<String, Object> attributes) {
        this.attributes = attributes;
    }

    public String getAttribute(String code) {
        return attributes.get(code) != null ? (String) attributes.get(code) : null;
    }

    public String getId() {
        Object id = attributes.get("id");
        return id != null ? id.toString() : null;
    }

    public String getLogin() {
        return getAttribute("login");
    }

    public String getName() {
        return getAttribute("name");
    }

    public String getEmail() {
        return getAttribute("email");
    }

    public String getAvatarUrl() {
        return getAttribute("avatar_url");
    }
}