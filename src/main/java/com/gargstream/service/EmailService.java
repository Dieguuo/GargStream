package com.gargstream.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String remitente;

    // método privado genérico para enviar html
    private void enviarCorreoHTML(String destinatario, String asunto, String contenidoHtml) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "utf-8");

            helper.setTo(destinatario);
            helper.setSubject(asunto);
            helper.setFrom(remitente);
            helper.setText(contenidoHtml, true);

            mailSender.send(mimeMessage);

        } catch (MessagingException e) {
            System.err.println("error crítico al enviar email a " + destinatario);
            e.printStackTrace();
        }
    }

    // plantilla base html con diseño oscuro y dorado
    private String generarPlantillaBase(String titulo, String mensajePrincipal, String contenidoDestacado, String piePagina) {
        return String.format("""
            <!DOCTYPE html>
            <html>
            <body style="margin:0; padding:0; background-color: #0f0f0f; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
                <div style="width: 100%%; background-color: #0f0f0f; padding: 40px 0;">
                    <div style="max-width: 500px; margin: 0 auto; background-color: #1f1f1f; border-radius: 8px; overflow: hidden; border: 1px solid #333; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                        
                        <div style="background-color: #000000; padding: 25px; text-align: center; border-bottom: 3px solid #ffb400;">
                            <h1 style="margin: 0; color: #ffb400; font-family: 'Arial Black', sans-serif; letter-spacing: 2px; font-size: 24px;">GARGSTREAM</h1>
                        </div>
                        
                        <div style="padding: 35px 30px; text-align: center;">
                            <h2 style="color: #ffffff; margin-top: 0; font-size: 20px; font-weight: normal;">%s</h2>
                            
                            <p style="color: #cccccc; font-size: 15px; line-height: 1.6; margin: 20px 0;">
                                %s
                            </p>
                            
                            <div style="background-color: #2a2a2a; margin: 30px 0; padding: 20px; border-radius: 6px; border: 1px dashed #444;">
                                %s
                            </div>
                            
                            <p style="color: #666666; font-size: 13px; margin-top: 30px;">
                                %s
                            </p>
                        </div>
                        
                        <div style="background-color: #181818; padding: 15px; text-align: center; border-top: 1px solid #2a2a2a;">
                            <p style="margin: 0; color: #444; font-size: 11px;">
                                © 2026 gargstream.
                            </p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
            """, titulo, mensajePrincipal, contenidoDestacado, piePagina);
    }

    // enviar código de verificación
    public void enviarCodigoVerificacion(String toEmail, String codigo) {
        String titulo = "Verifica tu Correo";
        String mensaje = "hemos recibido una solicitud para verificar tu cuenta. usa este código:";

        String destacado = String.format("""
            <span style="display: block; font-size: 32px; font-weight: bold; color: #ffb400; letter-spacing: 5px; font-family: monospace;">
                %s
            </span>
            """, codigo);

        String pie = "este código caduca en 10 minutos.";

        String html = generarPlantillaBase(titulo, mensaje, destacado, pie);
        enviarCorreoHTML(toEmail, "código de verificación - gargstream", html);
    }

    // enviar recuperación de contraseña
    public void enviarCodigoRecuperacion(String toEmail, String codigo) {
        String titulo = "Restablecer Contraseña";
        String mensaje = "se ha solicitado una nueva contraseña para tu cuenta.";

        String destacado = String.format("""
            <span style="display: block; font-size: 32px; font-weight: bold; color: #ff555e; letter-spacing: 5px; font-family: monospace;">
                %s
            </span>
            <span style="display: block; font-size: 12px; color: #999; margin-top: 10px;">código de seguridad</span>
            """, codigo);

        String pie = "el código expira en 15 minutos. no lo compartas.";

        String html = generarPlantillaBase(titulo, mensaje, destacado, pie);
        enviarCorreoHTML(toEmail, "recuperación de acceso - gargstream", html);
    }

    // confirmación al usuario de su sugerencia
    public void enviarConfirmacionUsuario(String emailUsuario, String nombreUsuario, String asuntoOriginal) {
        String titulo = "¡Mensaje Recibido!";
        String mensaje = String.format("hola <strong>%s</strong>, hemos recibido tu mensaje: <em style='color:#ffb400'>%s</em>.", nombreUsuario, asuntoOriginal);

        String destacado = """
            <p style="margin:0; color:#ddd; font-size:14px;">
                tu solicitud ha entrado en revisión.
            </p>
            """;

        String pie = "el equipo de soporte te contestará pronto si es necesario.";

        String html = generarPlantillaBase(titulo, mensaje, destacado, pie);
        enviarCorreoHTML(emailUsuario, "hemos recibido tu mensaje - gargstream", html);
    }

    // notificación al admin de nueva sugerencia
    public void enviarSugerenciaHTML(String usuarioNombre, String asuntoUsuario, String mensajeUsuario) {
        String titulo = "Nueva Sugerencia";
        String mensaje = String.format("el usuario <strong>%s</strong> ha enviado un mensaje de contacto.", usuarioNombre);

        String destacado = String.format("""
            <div style="text-align: left; font-style: italic; color: #fff;">
                "%s"
            </div>
            """, mensajeUsuario.replace("\n", "<br>"));

        String pie = "asunto original: " + asuntoUsuario;

        String html = generarPlantillaBase(titulo, mensaje, destacado, pie);
        enviarCorreoHTML(remitente, "sugerencia: " + asuntoUsuario, html);
    }
}