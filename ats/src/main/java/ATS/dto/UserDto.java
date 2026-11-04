package ATS.dto;


import ATS.enums.Role;
import lombok.Data;

import java.util.Date;

@Data

public class UserDto {
    private String fullname;
    private String password;
    private String email;
    private Date createdAt;
    private Role role;

}
