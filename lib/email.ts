import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendVerificationEmail = async (email: string, token: string) => {
    const confirmLink = `${process.env.NEXTAUTH_URL}/verify-email?token=${token}`;

    const { data, error } = await resend.emails.send({
        from: process.env.SMTP_FROM || 'onboarding@resend.dev',
        to: email,
        subject: "Confirm your email",
        html: `<p>Click <a href="${confirmLink}">here</a> to confirm your email.</p>`,
    });

    if (error) {
        console.error("Failed to send verification email:", error);
        throw new Error("Email sending failed");
    }

    return data;
};
