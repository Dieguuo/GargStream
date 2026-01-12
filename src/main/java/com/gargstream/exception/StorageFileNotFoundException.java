package com.gargstream.exception;

public class StorageFileNotFoundException extends RuntimeException {
    public StorageFileNotFoundException(String message) {
        super(message);
    }

    public StorageFileNotFoundException(String mensaje, Throwable causa){
        super(mensaje, causa);
    }
}


