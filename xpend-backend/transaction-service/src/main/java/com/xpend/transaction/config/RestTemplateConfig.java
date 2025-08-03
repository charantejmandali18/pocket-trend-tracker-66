package com.xpend.transaction.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.ClientHttpRequestInterceptor;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

@Configuration
public class RestTemplateConfig {
    
    @Bean
    public RestTemplate restTemplate() {
        RestTemplate restTemplate = new RestTemplate();
        
        // Add interceptors
        List<ClientHttpRequestInterceptor> interceptors = new ArrayList<>();
        interceptors.add(new LoggingInterceptor());
        restTemplate.setInterceptors(interceptors);
        
        return restTemplate;
    }
    
    /**
     * Interceptor for logging REST template requests
     */
    public static class LoggingInterceptor implements ClientHttpRequestInterceptor {
        
        private static final org.slf4j.Logger logger = 
                org.slf4j.LoggerFactory.getLogger(LoggingInterceptor.class);
        
        @Override
        public org.springframework.http.client.ClientHttpResponse intercept(
                org.springframework.http.HttpRequest request,
                byte[] body,
                org.springframework.http.client.ClientHttpRequestExecution execution) throws java.io.IOException {
            
            long startTime = System.currentTimeMillis();
            
            logger.debug("REST Request: {} {}", request.getMethod(), request.getURI());
            
            org.springframework.http.client.ClientHttpResponse response = execution.execute(request, body);
            
            long duration = System.currentTimeMillis() - startTime;
            
            logger.debug("REST Response: {} {} - Status: {} - Duration: {}ms",
                    request.getMethod(), request.getURI(), response.getStatusCode(), duration);
            
            return response;
        }
    }
}