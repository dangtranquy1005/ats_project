package ATS.service;

import ATS.entities.User;
import ATS.enums.Role;
import ATS.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class CustomUserDetailsService implements UserDetailsService {
    @Autowired
    private UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + username));
        Role role = user.getRole() == null ? Role.RECRUITER : user.getRole();

        return org.springframework.security.core.userdetails.User.builder()
                .username(user.getEmail())
                .password(user.getPasswordHash())
                .authorities(role.name())
                .accountExpired(false)
                .accountLocked(user.getUserStatus() == ATS.enums.UserStatus.LOCKED)
                .credentialsExpired(false)
                .disabled(false)
                .build();
    }
}
