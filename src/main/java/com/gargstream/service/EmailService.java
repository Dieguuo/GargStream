package com.gargstream.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.mail.javamail.MimeMessageHelper;

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


    //para enviar sugerencias
    public void enviarSugerenciaHTML(String usuarioNombre, String asuntoUsuario, String mensajeUsuario) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "utf-8");

            helper.setTo(remitente);
            helper.setSubject("Nueva Sugerencia de: " + usuarioNombre);
            helper.setFrom(remitente);

            String htmlMsg = String.format("""
                <div style="background-color: #141414; padding: 40px; font-family: Arial, sans-serif; color: #e5e5e5;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: #1f1f1f; border-radius: 8px; overflow: hidden; border: 1px solid #333;">
                        <div style="background-color: #ffb400; padding: 20px; text-align: center;">
                            <h2 style="margin: 0; color: #000; font-family: 'Arial Black', sans-serif;">GARGSTREAM</h2>
                        </div>
                        <div style="padding: 30px;">
                            <h3 style="color: #ffb400; margin-top: 0;">%s</h3>
                            <p style="color: #a3a3a3; font-size: 0.9em; margin-bottom: 20px;">
                                Enviado por el usuario: <strong style="color: white;">%s</strong>
                            </p>
                            <div style="background-color: #2a2a2a; padding: 15px; border-left: 4px solid #ffb400; border-radius: 4px;">
                                <p style="margin: 0; line-height: 1.6; color: #ddd;">%s</p>
                            </div>
                            <p style="margin-top: 30px; font-size: 0.8em; color: #666; text-align: center;">
                                Este mensaje fue enviado desde el formulario de contacto de la aplicación.
                            </p>
                        </div>
                    </div>
                </div>
                """, asuntoUsuario, usuarioNombre, mensajeUsuario.replace("\n", "<br>"));

            helper.setText(htmlMsg, true); // true indica que es HTML
            mailSender.send(mimeMessage);

        } catch (MessagingException e) {
            // Manejo de error básico
            System.err.println("Error al enviar correo HTML: " + e.getMessage());
        }
    }



    // confirmar al usuario que se ha enciado su sugerencia
    public void enviarConfirmacionUsuario(String emailUsuario, String nombreUsuario, String asuntoOriginal) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "utf-8");

            helper.setTo(emailUsuario);
            helper.setSubject("Hemos recibido tu mensaje: " + asuntoOriginal);
            helper.setFrom(remitente);

            // plantilla html para el usuario
            String htmlMsg = String.format("""
                <div style="background-color: #141414; padding: 40px; font-family: Arial, sans-serif; color: #e5e5e5;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: #1f1f1f; border-radius: 8px; overflow: hidden; border: 1px solid #333;">
                        <div style="background-color: #ffb400; padding: 20px; text-align: center;">
                            <h2 style="margin: 0; color: #000; font-family: 'Arial Black', sans-serif;">GARGSTREAM</h2>
                        </div>
                        <div style="padding: 30px; text-align: center;">
                            <h3 style="color: #ffb400; margin-top: 0;">¡Hola, %s!</h3>
                            
                            <p style="color: #ddd; font-size: 1.1em; line-height: 1.6;">
                                Hemos recibido correctamente tu mensaje sobre: <strong style="color: white;">"%s"</strong>.
                            </p>
                            
                            <p style="color: #aaa; font-size: 0.9em; margin: 20px 0;">
                                El equipo de administración revisará tu solicitud lo antes posible y te contestaremos si es necesario.
                            </p>
                            
                            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #333;">
                                <p style="color: #666; font-size: 0.8em;">
                                    Gracias por ayudarnos a mejorar GargStream.<br>
                                    Atentamente, el equipo de soporte.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                """, nombreUsuario, asuntoOriginal);

            helper.setText(htmlMsg, true);
            mailSender.send(mimeMessage);

        } catch (MessagingException e) {
            System.err.println("Error al enviar confirmación al usuario: " + e.getMessage());
        }
    }
}
