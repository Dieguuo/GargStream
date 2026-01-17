package com.gargstream.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    public void enviarCodigoVerificacion(String toEmail, String codigo){
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom("gargstream@gmail.com");
        message.setTo(toEmail);
        message.setSubject("Código de verificación - GargStream");
        message.setText("Hola,\n\nTu código para cambiar el correo electrónico es:\n\n" + codigo + "\n\nEste código caduca en 10 minutos.\n\nSi no has sido tú, ignora este mensaje.");

        mailSender.send(message);

    }
}
