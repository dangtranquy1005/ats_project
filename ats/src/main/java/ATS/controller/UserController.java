package ATS.controller;

import ATS.dto.LoginRequest;
import ATS.dto.LoginResponse;
import ATS.dto.UserDto;
import ATS.entities.User;
import ATS.exceptionresponse.BaseResponse;
import ATS.security.TokenProvider;
import ATS.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("api/v1/user")
public class UserController {
    private final UserService userService;
    private final AuthenticationManager authenticationManager;
    private final TokenProvider tokenProvider;

    public UserController(UserService userService, AuthenticationManager authenticationManager, TokenProvider tokenProvider) {
        this.userService = userService;
        this.authenticationManager = authenticationManager;
        this.tokenProvider = tokenProvider;
    }

    @PostMapping("/create")
    public ResponseEntity<BaseResponse<UserDto>> createUser(@RequestBody UserDto userDto) {
        if (userService.existsByEmail(userDto.getEmail())) {
            return ResponseEntity.badRequest().body(BaseResponse.error(400, "User's email already exist"));
        }
        else{
            User user = userService.RegisterUser(userDto);
            return  ResponseEntity.status(HttpStatus.CREATED).body(BaseResponse.ok(convert(user) ,null));
        }

    }

    @PostMapping("/login")
    public ResponseEntity<BaseResponse<LoginResponse>> login(@RequestBody LoginRequest loginRequest) {
        try {
            // Xác thực user
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getEmail(),
                            loginRequest.getPassword()
                    )
            );

            // Lưu vào SecurityContext
            SecurityContextHolder.getContext().setAuthentication(authentication);

            // Tạo JWT token
            String token = tokenProvider.generateToken(authentication);

            // Lấy thông tin user
            User user = userService.findByEmail(loginRequest.getEmail());

            LoginResponse response = new LoginResponse(token, user.getEmail(), user.getFullName());
            return ResponseEntity.ok(BaseResponse.ok(response, null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(BaseResponse.error(401, "Email hoặc mật khẩu không chính xác"));
        }
    }

   private UserDto convert(User user) {
    UserDto userDto = new UserDto();
    userDto.setFullname(user.getFullName());
    userDto.setEmail(user.getEmail());
    userDto.setRole(user.getRole());
    return userDto;

   }
}
