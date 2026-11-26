package ATS.security;

import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Slf4j
public class JwtAuthFilter extends OncePerRequestFilter {
    private final TokenProvider tokenProvider;
    private final UserDetailsService userDetailsService;

    public JwtAuthFilter(TokenProvider tokenProvider, UserDetailsService userDetailsService) {
        this.tokenProvider = tokenProvider;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected boolean shouldNotFilterAsyncDispatch() {
        // Streaming PDF được redispatch ASYNC; khôi phục JWT cho lượt kiểm tra quyền này.
        return false;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String authorization = request.getHeader("Authorization");
        if (StringUtils.hasText(authorization) && authorization.regionMatches(true, 0, "Bearer ", 0, 7)) {
            authenticate(request, authorization.substring(7).strip());
        }
        filterChain.doFilter(request, response);
    }

    private void authenticate(HttpServletRequest request, String token) {
        if (token.isEmpty() || token.regionMatches(true, 0, "Bearer ", 0, 7)) {
            log.warn("Rejected Authorization header with an empty token or repeated Bearer prefix");
            return;
        }

        try {
            String username = tokenProvider.getUsernameFromJWT(token);
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);
            if (!userDetails.isEnabled() || !userDetails.isAccountNonLocked()
                    || !userDetails.isAccountNonExpired() || !userDetails.isCredentialsNonExpired()) return;
            var authentication = new UsernamePasswordAuthenticationToken(
                    userDetails, null, userDetails.getAuthorities());
            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(authentication);
        } catch (JwtException | IllegalArgumentException | UsernameNotFoundException e) {
            log.warn("Rejected bearer authentication ({})", e.getClass().getSimpleName());
        }
    }
}
