package com.xpend.transaction.security;

import com.xpend.transaction.service.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    
    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);
    
    private final JwtService jwtService;
    
    public JwtAuthenticationFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }
    
    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {
        
        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        
        // Check if Authorization header is present and starts with Bearer
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }
        
        jwt = authHeader.substring(7);
        
        try {
            // Validate JWT token
            if (jwtService.validateToken(jwt)) {
                
                // Extract user information from token
                Map<String, Object> userInfo = jwtService.extractUserInfo(jwt);
                Long userId = (Long) userInfo.get("userId");
                String username = (String) userInfo.get("username");
                
                if (userId != null && username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                    
                    // Extract roles and convert to authorities
                    @SuppressWarnings("unchecked")
                    List<String> roles = (List<String>) userInfo.get("roles");
                    List<SimpleGrantedAuthority> authorities = roles != null ? 
                            roles.stream()
                                 .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
                                 .collect(Collectors.toList()) :
                            List.of(new SimpleGrantedAuthority("ROLE_USER"));
                    
                    // Create authentication token with user info as principal
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userInfo, // Use full user info as principal
                            null,
                            authorities
                    );
                    
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    
                    // Set authentication in security context
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                    
                    logger.debug("JWT authentication successful for user: {}", userId);
                }
            } else {
                logger.debug("JWT token validation failed");
            }
            
        } catch (Exception e) {
            logger.error("JWT authentication error: {}", e.getMessage());
            // Clear security context on error
            SecurityContextHolder.clearContext();
        }
        
        filterChain.doFilter(request, response);
    }
    
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) throws ServletException {
        String path = request.getRequestURI();
        
        // Skip JWT filter for public endpoints
        return path.contains("/health") || 
               path.contains("/actuator") ||
               path.startsWith("/public/");
    }
}