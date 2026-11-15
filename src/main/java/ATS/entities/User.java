package ATS.entities;

import ATS.enums.Role;
import ATS.enums.UserStatus;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;
import java.util.Date;

@Data
@Entity
@FieldDefaults(level = AccessLevel.PRIVATE)
@Table(name = "tbl_users")
public class User {
    Role role;
    @Id
    long id;
    String fullName;
    String email;
    String passwordHash;
    Date createdAt;
    Date updatedAt;
    UserStatus userStatus;


    public boolean hasRole(Role UserRole) {
        return this.role == UserRole;
    }
    public boolean isLocked(UserStatus userStatus) {return userStatus == UserStatus.LOCKED;}

}
