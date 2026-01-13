package com.gargstream.controller;

import com.gargstream.service.AlmacenamientoService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.IOException;
import java.util.*;

@RestController
@RequestMapping("/api/archivos")
@RequiredArgsConstructor
public class AlmacenamientoController {

    //BORRAR 2 LINEAS
    @org.springframework.beans.factory.annotation.Value("${tmdb.api.key}")
    private String apiKeyPrueba;

    private final AlmacenamientoService almacenamientoService;

    //subir un archivo POST http://localhost:8080/api/archivos/subir
    @PostMapping("/subir")
    public Map<String, String> subirArchivo(@RequestParam("fichero") MultipartFile fichero){

        // ¡OJO! Esto es solo para probar. Luego bórralo para no mostrar tu clave en los logs.
        System.out.println("--- PRUEBA DE SEGURIDAD ---");
        System.out.println("Mi clave de TMDB es: " + apiKeyPrueba);
        System.out.println("---------------------------");


        String nombreArchivo = almacenamientoService.store(fichero);
        //crear la url pública
        String url = ServletUriComponentsBuilder.fromCurrentContextPath().path("/api/archivos/").path(nombreArchivo).toUriString();
        return Map.of("url", url);
    }

    //ver o descargar un archivo http://localhost:8080/api/archivos/{nombreArchivo}
    @GetMapping("/{nombreArchivo:.+}") //con el + puede haber . en el nombre del archivo
    public ResponseEntity<Resource> verArchivo(@PathVariable String nombreArchivo){
        Resource recurso = almacenamientoService.loadAsResource(nombreArchivo);

        //detectar que tipo de archivo es
        String contentType = null;
        try{
            contentType = java.nio.file.Files.probeContentType(recurso.getFile().toPath());
        } catch (Exception e) {

        }

        //si no se detecta se pone binario (genérico)
        if (contentType == null){
            contentType = "application/octet-stream";
        }

        //devolver el archivo tal cual
        return ResponseEntity.ok().header(HttpHeaders.CONTENT_DISPOSITION,"inline; filename=\"" + recurso.getFilename() + "\"").body(recurso);
    }

}
