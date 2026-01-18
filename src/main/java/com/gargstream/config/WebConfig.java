package com.gargstream.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.web.servlet.config.annotation.ContentNegotiationConfigurer;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    //la ruta que he puesto en application properties
    @Value("${gargstream.upload.path}")
    private String uploadPath;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // permite acceder a la carpeta física mediafiles y desactiva el cache para que se noten los cambios al instante
        //porque me daba problemas para los subtítulos de varios idiomas a la vez.
        registry.addResourceHandler("/api/archivos/**")
                .addResourceLocations("file:mediafiles/")
                .setCachePeriod(0);


        // para los avatares no se guarden en img
        // convierte la ruta relativa uploads/ a absoluta para evitar errores
        Path rutaUploads = Paths.get(uploadPath);
        String rutaUri = rutaUploads.toAbsolutePath().toUri().toString();

        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(rutaUri);
    }

    // decirle al server que es vtt para los subtitulos
    @Override
    public void configureContentNegotiation(ContentNegotiationConfigurer configurer) {
        configurer.mediaType("vtt", MediaType.parseMediaType("text/vtt"));
    }



}