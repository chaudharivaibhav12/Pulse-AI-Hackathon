// lib/sos.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function triggerEmergencyEmail(reason: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'PulseAI <onboarding@resend.dev>', // Resend gives you this default for testing
      to: ['ojaswikaushik14@gmail.com'], // Change to your email for the demo
      subject: `🚨 ALERT: Cardiac Symptoms Detected - Maria`,
      html: `
        <h2>Emergency Alert from Pulse AI</h2>
        <p><strong>Patient:</strong> Maria</p>
        <p><strong>Symptom Reported:</strong> ${reason}</p>
        <p><strong>Status:</strong> Care team notification triggered via Guardian Heart Agent.</p>
        <hr />
        <p><em>This is an automated alert from the Pulse AI Hackathon Prototype.</em></p>
      `,
    });

    if (error) {
      console.error("Email Error:", error);
      return { success: false };
    }

    return { success: true };
  } catch (err) {
    console.error("SOS Trigger Failed:", err);
    return { success: false };
  }
}