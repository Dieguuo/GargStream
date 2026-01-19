package com.gargstream.service;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;
import java.nio.file.Path;

public interface AlmacenamientoService {

    //iniciar la carpeta de subida de los archivos
    void init();

    //guardar el archivo que mande el usuario y devuelve el nombre con el que se ha guardado en la raiz
    String store(MultipartFile archivo);
    
    //cargar la ruta
    Path load(String nombreArchivo);
    
    //cargar el archivo como un recurso para que se pueda reproducir en el navegador
    Resource loadAsResource(String nombreArchivo);

    //borrar
    void delete(String nombreArchivo);
    void deleteAll();
    void eliminarDirectorioSiVacio(String nombreDirectorio);


    //obtener el espacio usado en el disco para la cuenta total ocuapado
    long obtenerEspacioUsado();
    //obtener el espacio total del disco
    long obtenerEspacioTotal();
    
    /*mejora de estuctura de carpetas*/
    //guardar los archivos en carpetas organizadas
    String store(MultipartFile archivo, String rutaDestino);
    
    //sanitizar lso nombres raros para que no haya : / ´
    String sanitizarNombre(String nombreOriginal);
    
    //borrar una carpeta entera
    void eliminarCarpeta(String nombreCarpeta);

}
