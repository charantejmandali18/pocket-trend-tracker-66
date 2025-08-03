package com.xpend.extraction.security;

import com.xpend.extraction.service.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    
    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);
    private static final String BEARER_PREFIX = "Bearer ";
    private static final String AUTHORIZATION_HEADER = "Authorization";
    
    @Autowired
    private JwtService jwtService;
    
    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {
        
        try {
            String authHeader = request.getHeader(AUTHORIZATION_HEADER);
            
            if (authHeader == null || !authHeader.startsWith(BEARER_PREFIX)) {
                filterChain.doFilter(request, response);
                return;
            }
            
            String jwt = authHeader.substring(BEARER_PREFIX.length());
            
            if (jwtService.isTokenValid(jwt)) {
                String username = jwtService.extractUsername(jwt);
                Long userId = jwtService.extractUserId(jwt);
                
                if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                    UserDetails userDetails = User.builder()
                            .username(username)
                            .password("") // Not used for JWT authentication
                            .authorities(new ArrayList<>())
                            .build();
                    
                    UsernamePasswordAuthenticationToken authToken = 
                            new UsernamePasswordAuthenticationToken(
                                    userDetails, 
                                    null, 
                                    userDetails.getAuthorities());
                    
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    
                    // Store user ID in security context for easy access
                    request.setAttribute("userId", userId);
                    request.setAttribute("username", username);
                    
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                    
                    logger.debug("JWT authentication successful for user: {}", username);
                }
            } else {
                logger.debug("Invalid JWT token received");
            }
            
        } catch (Exception e) {
            logger.error("JWT authentication failed", e);
        }
        
        filterChain.doFilter(request, response);
    }
    
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) throws ServletException {
        String path = request.getRequestURI();
        
        boolean shouldSkip = path.startsWith("/public") ||
               path.startsWith("/oauth-dev") ||
               path.startsWith("/api/health") ||
               path.startsWith("/actuator") ||
               path.startsWith("/api/oauth2/callback") ||
               path.startsWith("/api/oauth2/authorize") ||
               path.startsWith("/api/email-auth/callback") ||
               path.startsWith("/api/email-auth/gmail/authorize") ||
               path.startsWith("/api/email-auth/gmail/exchange") ||
               path.startsWith("/api/email-auth/outlook/authorize");
        
        if (shouldSkip) {
            logger.debug("Skipping JWT filter for path: {}", path);
        }
        
        return shouldSkip;
    }
}