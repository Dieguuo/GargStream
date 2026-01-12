package com.gargstream;

import com.gargstream.service.AlmacenamientoService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class GargStreamApplication {

	public static void main(String[] args) {
		SpringApplication.run(GargStreamApplication.class, args);
	}

	@Bean
	CommandLineRunner init(AlmacenamientoService almacenamientoService){
		return (args) ->{
			almacenamientoService.init();
		};
	}

}
