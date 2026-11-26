package ATS.dto;

import ATS.enums.Role;

/** Thông tin phiên đăng nhập; không trả mật khẩu hoặc password hash. */
public record UserProfileResponse(Long id, String fullName, String email, Role role) {}
