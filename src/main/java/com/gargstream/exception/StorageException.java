package com.gargstream.exception;

public class StorageException extends RuntimeException {
    public StorageException(String message) {
        super(message);
    }

    public StorageException(String mensaje, Throwable causa){
        super(mensaje, causa);
    }
}
