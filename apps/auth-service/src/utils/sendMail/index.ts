import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import ejs from 'ejs';
import path from 'path';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  service: process.env.SMTP_SERVICE,
  auth: {
    user: process.env.SMTP_MAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

const generateMailTemplate = async (
  templateName: string,
  data: Record<string, any>
): Promise<string> => {
  const templatePath = path.join(
    process.cwd(),
    'apps',
    'auth-service',
    'src',
    'utils',
    'mail-templates',
    `${templateName}.ejs`
  );
  const html = await ejs.renderFile(templatePath, data);
  return html;
};

export const sendMail = async (
  to: string,
  subject: string,
  templateName: string,
  data: Record<string, any>
) => {
  try {
    const html = await generateMailTemplate(templateName, data);
    await transporter.sendMail({
      from: `<${process.env.STMP_USER}`,
      to,
      subject,
      html,
    });
    return true;
  } catch (err) {
    console.log('Error sending mail', err);
    return false;
  }
};

export default transporter;
