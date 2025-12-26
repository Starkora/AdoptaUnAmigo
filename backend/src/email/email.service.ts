import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async sendAdoptionRequestNotification(
    rescuerEmail: string,
    rescuerName: string,
    adopterName: string,
    dogName: string,
    requestId: string,
  ) {
    const mailOptions = {
      from: `"AdoptaUnAmigo" <${process.env.EMAIL_USER}>`,
      to: rescuerEmail,
      subject: `Nueva solicitud de adopción para ${dogName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
            <h1 style="margin: 0;">AdoptaUnAmigo</h1>
          </div>
          
          <div style="padding: 30px; background: #f9fafb;">
            <h2 style="color: #333;">Hola ${rescuerName},</h2>
            <p style="font-size: 16px; color: #555; line-height: 1.6;">
              Tienes una nueva solicitud de adopción para <strong>${dogName}</strong>.
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
              <p style="margin: 0; color: #666;">
                <strong>Adoptante:</strong> ${adopterName}
              </p>
            </div>
            
            <p style="font-size: 16px; color: #555; line-height: 1.6;">
              Revisa los detalles de la solicitud en tu dashboard y decide si aprobarla o rechazarla.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:4200'}/dashboard/rescatista" 
                 style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Ver Dashboard
              </a>
            </div>
          </div>
          
          <div style="padding: 20px; text-align: center; background: #e5e7eb; color: #6b7280; font-size: 14px;">
            <p style="margin: 0;">Este correo fue enviado automáticamente. Por favor no respondas a este mensaje.</p>
          </div>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Error sending adoption request email:', error);
    }
  }

  async sendAdoptionApprovedNotification(
    adopterEmail: string,
    adopterName: string,
    dogName: string,
    rescuerName: string,
  ) {
    const mailOptions = {
      from: `"AdoptaUnAmigo" <${process.env.EMAIL_USER}>`,
      to: adopterEmail,
      subject: `Tu solicitud de adopción ha sido aprobada`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
            <h1 style="margin: 0;">AdoptaUnAmigo</h1>
          </div>
          
          <div style="padding: 30px; background: #f9fafb;">
            <h2 style="color: #333;">¡Felicidades ${adopterName}!</h2>
            <p style="font-size: 16px; color: #555; line-height: 1.6;">
              Tu solicitud para adoptar a <strong>${dogName}</strong> ha sido aprobada por ${rescuerName}.
            </p>
            
            <div style="background: #dcfce7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #22c55e;">
              <p style="margin: 0; color: #166534;">
                ✓ Solicitud aprobada
              </p>
            </div>
            
            <p style="font-size: 16px; color: #555; line-height: 1.6;">
              Puedes ponerte en contacto con el rescatista a través del chat para coordinar los siguientes pasos.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:4200'}/chat" 
                 style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Ir al Chat
              </a>
            </div>
          </div>
          
          <div style="padding: 20px; text-align: center; background: #e5e7eb; color: #6b7280; font-size: 14px;">
            <p style="margin: 0;">Este correo fue enviado automáticamente. Por favor no respondas a este mensaje.</p>
          </div>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Error sending adoption approved email:', error);
    }
  }

  async sendAdoptionCancelledNotification(
    rescuerEmail: string,
    rescuerName: string,
    adopterName: string,
    dogName: string,
    reason: string,
  ) {
    const mailOptions = {
      from: `"AdoptaUnAmigo" <${process.env.EMAIL_USER}>`,
      to: rescuerEmail,
      subject: `Adopción cancelada: ${dogName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
            <h1 style="margin: 0;">AdoptaUnAmigo</h1>
          </div>
          
          <div style="padding: 30px; background: #f9fafb;">
            <h2 style="color: #333;">Hola ${rescuerName},</h2>
            <p style="font-size: 16px; color: #555; line-height: 1.6;">
              ${adopterName} ha cancelado su solicitud de adopción para <strong>${dogName}</strong>.
            </p>
            
            <div style="background: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
              <p style="margin: 0 0 10px 0; color: #991b1b;">
                <strong>Motivo de la cancelación:</strong>
              </p>
              <p style="margin: 0; color: #7f1d1d;">
                ${reason}
              </p>
            </div>
            
            <p style="font-size: 16px; color: #555; line-height: 1.6;">
              ${dogName} estará disponible nuevamente para otros adoptantes.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:4200'}/dashboard/rescatista" 
                 style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Ver Dashboard
              </a>
            </div>
          </div>
          
          <div style="padding: 20px; text-align: center; background: #e5e7eb; color: #6b7280; font-size: 14px;">
            <p style="margin: 0;">Este correo fue enviado automáticamente. Por favor no respondas a este mensaje.</p>
          </div>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Error sending adoption cancelled email:', error);
    }
  }

  async sendNewMessageNotification(
    recipientEmail: string,
    recipientName: string,
    senderName: string,
    messagePreview: string,
  ) {
    const mailOptions = {
      from: `"AdoptaUnAmigo" <${process.env.EMAIL_USER}>`,
      to: recipientEmail,
      subject: `Nuevo mensaje de ${senderName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
            <h1 style="margin: 0;">AdoptaUnAmigo</h1>
          </div>
          
          <div style="padding: 30px; background: #f9fafb;">
            <h2 style="color: #333;">Hola ${recipientName},</h2>
            <p style="font-size: 16px; color: #555; line-height: 1.6;">
              Tienes un nuevo mensaje de <strong>${senderName}</strong>.
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
              <p style="margin: 0; color: #666; font-style: italic;">
                "${messagePreview.substring(0, 100)}${messagePreview.length > 100 ? '...' : ''}"
              </p>
            </div>
            
            <p style="font-size: 16px; color: #555; line-height: 1.6;">
              Responde a través de la plataforma para continuar la conversación.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:4200'}/chat" 
                 style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Ver Mensajes
              </a>
            </div>
          </div>
          
          <div style="padding: 20px; text-align: center; background: #e5e7eb; color: #6b7280; font-size: 14px;">
            <p style="margin: 0;">Este correo fue enviado automáticamente. Por favor no respondas a este mensaje.</p>
          </div>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Error sending new message email:', error);
    }
  }
}
