package com.gargstream.controller;

import com.gargstream.exception.FormatoInvalidoException;
import com.gargstream.exception.StorageFileNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

@ControllerAdvice
public class GlobalExceptionHandler {

    //cuando se sube un formato que no es válido
    @ExceptionHandler(FormatoInvalidoException.class)
    public ResponseEntity<String> manejarFormatoInvalido(FormatoInvalidoException ex) {
        String tituloError = "Formato Incorrecto";
        String mensajeError = ex.getMessage();

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(tituloError + ": " + mensajeError);
    }

    // cuando el archivo es demasiado grande
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<String> manejarArchivoMuyGrande(MaxUploadSizeExceededException ex) {
        String tituloError = "Archivo Muy Grande";
        String mensajeError = "El archivo supera el límite permitido. Intenta con uno más pequeño.";

        return ResponseEntity
                .status(HttpStatus.PAYLOAD_TOO_LARGE)
                .body(tituloError + ": " + mensajeError);
    }

    // error de archivo no enonctrado
    @ExceptionHandler(StorageFileNotFoundException.class)
    public ResponseEntity<String> manejarArchivoNoEncontrado(StorageFileNotFoundException ex) {
        String tituloError = "Archivo No Disponible";
        String mensajeError = "El vídeo que intentas reproducir no se encuentra en el servidor. Es posible que haya sido borrado o movido.";

        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(tituloError + ": " + mensajeError);
    }

    //erorr 404
    @ExceptionHandler(NoResourceFoundException.class)
    public void manejar404(NoResourceFoundException ex) throws NoResourceFoundException {
        throw ex; // Lo relanzamos para que Spring Boot use su sistema de plantillas (tu carpeta /error)
    }

    // error genérico
    // Error genérico (500)
    @ExceptionHandler(Exception.class)
    public String manejarErrorGeneral(Exception ex) {
        ex.printStackTrace();

        // Esto busca el archivo en templates/error/500.html
        return "error/500";
    }
}