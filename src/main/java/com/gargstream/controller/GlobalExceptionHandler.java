package com.gargstream.controller;

import com.gargstream.exception.FormatoInvalidoException;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

@ControllerAdvice
public class GlobalExceptionHandler {
    //cuando se sube un formato que no es vídeo
    @ExceptionHandler(FormatoInvalidoException.class)
    public String manejarFormatoInvalido(FormatoInvalidoException ex,Model model) {
        model.addAttribute("tituloError", "Formato Incorrecto");
        model.addAttribute("mensajeError", ex.getMessage());
        return  "error_personalizado";
    }

    //cuando el archivo es muy grande
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public String manejarArchivoMuyGrande(MaxUploadSizeExceededException ex, Model model) {
        model.addAttribute("tituloError", "Archivo Muy Grande");
        model.addAttribute("mensajeError", "El archivo supera el límite permitido. Intenta con uno más pequeño.");
        return "error_personalizado";
    }
}
