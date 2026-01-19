package com.gargstream.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String remitente;

    //méttodo generico
    private void enviarCorreoBase(String destinatario, String asunto, String cuerpo) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(remitente);
        message.setTo(destinatario);
        message.setSubject(asunto);
        message.setText(cuerpo);

        mailSender.send(message);
    }

    // para cambiar de correo
    public void enviarCodigoVerificacion(String toEmail, String codigo){
        String asunto = "Código de verificación - GargStream";
        String cuerpo = "Hola,\n\nTu código para cambiar el correo electrónico es:\n\n"
                + codigo + "\n\nEste código caduca en 10 minutos.\n\n"
                + "Si no has sido tú, ignora este mensaje.";

        enviarCorreoBase(toEmail, asunto, cuerpo);
    }

    // para recuperar contraseña
    public void enviarCodigoRecuperacion(String toEmail, String codigo){
        String asunto = "Recuperación de Contraseña - GargStream";
        String cuerpo = "Hola,\n\nHemos recibido una solicitud para restablecer tu contraseña.\n\n"
                + "Tu código de recuperación es:\n\n" + codigo + "\n\n"
                + "Este código caduca en 15 minutos.\n\n"
                + "Si no has solicitado esto, puedes ignorar este correo de forma segura.";

        enviarCorreoBase(toEmail, asunto, cuerpo);
    }
}
