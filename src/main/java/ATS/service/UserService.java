package ATS.service;

import ATS.dto.UserDto;
import ATS.entities.User;

import java.util.List;

public interface UserService {
    User findById(Long id);
    User findByEmail(String email);
    User RegisterUser(UserDto RegisterRequest);
    boolean existsByEmail(String email);
    boolean existsByUsername(String username);
    List<User> findAll();

}
