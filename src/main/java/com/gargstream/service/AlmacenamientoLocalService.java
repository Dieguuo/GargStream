package com.gargstream.service;

import com.gargstream.exception.FormatoInvalidoException;
import com.gargstream.exception.StorageException;
import com.gargstream.exception.StorageFileNotFoundException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.util.stream.Stream;
import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;


@Service//con esto spring lo calga al iniciar
public class AlmacenamientoLocalService implements AlmacenamientoService{
    private final Path rootLocation; //la ruta final dodne se va a guardar todo

    //leer la propiedad de donde se guarda
    //value hace que se ponga el texto tal cual esté
    public AlmacenamientoLocalService(@Value("${storage.location}") String storageLocation){
        if(storageLocation.trim().length() == 0){
            throw new StorageException("La ruta de subida está vacía");
        }
        this.rootLocation = Paths.get(storageLocation);
    }

    @Override
    public void init(){
        try{
            //crear la carpeta de contenido-fisico si no existe
            Files.createDirectories(rootLocation);
        }catch (IOException e){
            throw new StorageException("No se ha podido iniciar la carpeta de almacenamiento");
        }
    }

    @Override
    public String store(MultipartFile archivo){
        try{
            if(archivo.isEmpty()){
                throw new StorageException("Error. El archivo está vacío");
            }

            //validar el tipo de archivo
            String tipoContenido = archivo.getContentType();
            //si no es un vídeo lanzo la excepción
            if(tipoContenido == null || (
                    !tipoContenido.startsWith("video/") &&
                            !tipoContenido.startsWith("image/") &&
                            !tipoContenido.equals("text/vtt") &&
                            !tipoContenido.equals("application/x-subrip") &&
                            !tipoContenido.equals("text/plain")
            )){
                throw new FormatoInvalidoException("Formato no válido: " + tipoContenido + ". Solo vídeo o subtítulos");
            }



            //obtener el nombre original
            String nombreArchivo = archivo.getOriginalFilename();
            //construir la ruta de destino
            Path destino = this.rootLocation.resolve(Paths.get(nombreArchivo)).normalize().toAbsolutePath();
            //copiar los bytes del archivo a la carpeta destino
            try(InputStream is = archivo.getInputStream()){
                Files.copy(is, destino, StandardCopyOption.REPLACE_EXISTING);
            }
            return nombreArchivo;
        }catch (IOException e){
            throw new StorageException("Error. Fallo al guardar el archivo.");
        }
    }


    @Override
    public Path load(String nombreArchivo){
        return rootLocation.resolve(nombreArchivo);
    }

    @Override
    public Resource loadAsResource(String nombreArchivo){
        try{
            Path file = load(nombreArchivo);
            //convertir la ruta del archivo en una url que el navegador pueda entender
            Resource resource = new UrlResource((file.toUri()));

            if(resource.exists() || resource.isReadable()){
                return resource;
            }else{
                throw new StorageFileNotFoundException("No se ha podido leer el archivo " + nombreArchivo);
            }
        }catch (MalformedURLException e){
            throw new StorageFileNotFoundException("No se ha podido leer el archivo "+ nombreArchivo, e);
        }
    }


    @Override
    public void delete(String nombreArchivo){
        try {
            Path archivo = rootLocation.resolve(nombreArchivo);
            //borrar el archivo si existe
            Files.deleteIfExists(archivo);
        } catch (IOException e){
            System.err.println("No se pudo borrar el archivo físico: " + nombreArchivo);
            e.printStackTrace();
        }

    }

    //borrar
    @Override
    public void deleteAll(){}


    //método para obtener el espacio usado total en el disco
    @Override
    public long obtenerEspacioUsado() {
        try (Stream<Path> walk = Files.walk(this.rootLocation)) {
            return walk
                    .filter(p -> p.toFile().isFile()) // para que solo sume archivos y no carpetas
                    .mapToLong(p -> p.toFile().length()) // para obtener el peso
                    .sum(); // sumarlo todo
        } catch (IOException e) {
            System.out.println("Error calculando espacio: " + e.getMessage());
            return 0;
        }
    }

    //sacar el espacio total del disco
    @Override
    public long obtenerEspacioTotal(){
        return this.rootLocation.toFile().getTotalSpace();
    }
}