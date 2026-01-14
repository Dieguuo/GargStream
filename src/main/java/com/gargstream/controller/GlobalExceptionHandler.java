package com.gargstream.controller;

import com.gargstream.exception.FormatoInvalidoException;
import com.gargstream.exception.StorageFileNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

@ControllerAdvice
public class GlobalExceptionHandler {

    //cuando se sube un formato que no es vídeo
    @ExceptionHandler(FormatoInvalidoException.class)
    public ResponseEntity<String> manejarFormatoInvalido(FormatoInvalidoException ex) {
        String tituloError = "Formato Incorrecto";
        String mensajeError = ex.getMessage();

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(tituloError + ": " + mensajeError);
    }

    //cuando el archivo es muy grande
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<String> manejarArchivoMuyGrande(MaxUploadSizeExceededException ex) {
        String tituloError = "Archivo Muy Grande";
        String mensajeError = "El archivo supera el límite permitido. Intenta con uno más pequeño.";

        return ResponseEntity
                .status(HttpStatus.PAYLOAD_TOO_LARGE)
                .body(tituloError + ": " + mensajeError);
    }

    //archivo no encontrado e le disco
    @ExceptionHandler(StorageFileNotFoundException.class)
    public ResponseEntity<String> manejarArchivoNoEncontrado(StorageFileNotFoundException ex) {
        String tituloError = "Archivo No Disponible";
        String mensajeError = "El vídeo que intentas reproducir no se encuentra en el servidor. Es posible que haya sido borrado o movido.";

        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(tituloError + ": " + mensajeError);
    }

    // 4. Error Genérico (Red de seguridad para todo lo demás)
    @ExceptionHandler(Exception.class)
    public ResponseEntity<String> manejarErrorGeneral(Exception ex) {
        ex.printStackTrace();

        // Estructura anterior: Titulo + Mensaje
        String tituloError = "Error Inesperado";
        String mensajeError = "Ha ocurrido un error: " + ex.getMessage();

        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(tituloError + ": " + mensajeError);
    }
}