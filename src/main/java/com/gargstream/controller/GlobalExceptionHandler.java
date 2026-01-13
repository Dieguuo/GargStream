package com.gargstream.controller;

import com.gargstream.exception.FormatoInvalidoException;
import com.gargstream.exception.StorageFileNotFoundException;
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

    //archivo no encontrado e le disco
    @ExceptionHandler(StorageFileNotFoundException.class)
    public String manejarArchivoNoEncontrado(StorageFileNotFoundException ex, Model model) {
        model.addAttribute("tituloError", "Archivo No Disponible");
        model.addAttribute("mensajeError", "El vídeo que intentas reproducir no se encuentra en el servidor. Es posible que haya sido borrado o movido.");
        return "error_personalizado";
    }

    // 4. Error Genérico (Red de seguridad para todo lo demás)
    @ExceptionHandler(Exception.class)
    public String manejarErrorGeneral(Exception ex, Model model) {
        model.addAttribute("tituloError", "Error Inesperado");
        model.addAttribute("mensajeError", "Ha ocurrido un error: " + ex.getMessage());
        return "error_personalizado";
    }
}
