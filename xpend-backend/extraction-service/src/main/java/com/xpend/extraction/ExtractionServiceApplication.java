package com.xpend.extraction;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class ExtractionServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(ExtractionServiceApplication.class, args);
    }
}