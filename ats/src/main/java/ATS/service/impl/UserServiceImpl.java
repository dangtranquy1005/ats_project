package ATS.service.impl;

import ATS.dto.UserDto;
import ATS.entities.User;
import ATS.repository.UserRepository;
import ATS.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {
    private final UserRepository userRepo;
    private final PasswordEncoder passwordEncoder;

    @Override
    public User findById(Long id) {
        return userRepo.findById(id).orElse(null);
    }

    @Override
    public User findByEmail(String email) {
        return userRepo.findByEmail(email);
    }

    @Override
    public User RegisterUser(UserDto userRequest) {
        User users = new User();
        users.setFullName(userRequest.getFullname());
        users.setEmail(userRequest.getEmail());
        // Mã hóa password trước khi lưu
        users.setPasswordHash(passwordEncoder.encode(userRequest.getPassword()));
        return userRepo.save(users);
    }

    @Override
    public boolean existsByEmail(String email) {
        return userRepo.existsByEmail(email);
    }

    @Override
    public boolean existsByUsername(String username) {
        return false;
    }

    @Override
    public List<User> findAll() {
        return userRepo.findAll();
    }
}
