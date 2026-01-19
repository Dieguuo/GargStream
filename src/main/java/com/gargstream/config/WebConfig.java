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

    //ruta de contenido
    @Value("${storage.location}")
    private String storageLocation;
    //la ruta para los avatares que he puesto en application properties
    @Value("${gargstream.upload.path}")
    private String uploadPath;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {

        // para vídeos y subtitulos
        Path rutaContenido = Paths.get(storageLocation);
        String rutaContenidoAbsoluta = rutaContenido.toAbsolutePath().toUri().toString();

        registry.addResourceHandler("/api/archivos/**")
                .addResourceLocations(rutaContenidoAbsoluta)
                .setCachePeriod(0);


        //para avatares
        Path rutaUploads = Paths.get(uploadPath);
        String rutaUploadsAbsoluta = rutaUploads.toAbsolutePath().toUri().toString();

        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(rutaUploadsAbsoluta);
    }

    // decirle al server que es vtt para los subtitulos
    @Override
    public void configureContentNegotiation(ContentNegotiationConfigurer configurer) {
        configurer.mediaType("vtt", MediaType.parseMediaType("text/vtt"));
    }



}