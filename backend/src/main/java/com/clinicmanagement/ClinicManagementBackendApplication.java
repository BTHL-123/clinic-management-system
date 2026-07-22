package com.clinicmanagement;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.EnableAsync;

import java.time.ZoneId;
import java.util.TimeZone;

@SpringBootApplication
@EnableScheduling
@EnableAsync
public class ClinicManagementBackendApplication {

	public static void main(String[] args) {
		String configuredTimeZone = System.getenv().getOrDefault("APP_TIME_ZONE", "Asia/Ho_Chi_Minh");
		TimeZone.setDefault(TimeZone.getTimeZone(ZoneId.of(configuredTimeZone)));
		SpringApplication.run(ClinicManagementBackendApplication.class, args);
	}

}
