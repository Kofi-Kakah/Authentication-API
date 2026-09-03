import nodemailer from "nodemailer";

const getTransporter = () => {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
        return null;
    }

    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD
        }
    });
};

export const sendEmail = async ({ to, subject, text }) => {
    const transporter = getTransporter();
    if (!transporter) {
        if (process.env.NODE_ENV === "production") {
            throw new Error("SMTP email settings are not configured");
        }
        console.log(`[email preview] To: ${to}\nSubject: ${subject}\n${text}`);
        return;
    }

    const result = await transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.SMTP_USER,
        replyTo: process.env.EMAIL_REPLY_TO || process.env.EMAIL_FROM || process.env.SMTP_USER,
        to,
        subject,
        text
    });

    if (!result.accepted?.includes(to)) {
        throw new Error(`Email provider rejected delivery to ${to}`);
    }

    console.log(`Email accepted by SMTP provider for ${to} (messageId: ${result.messageId})`);
};
