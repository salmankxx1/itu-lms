import html
import smtplib
import os
import secrets
import string
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging

import httpx
from dotenv import load_dotenv

# Ensure .env is always loaded
load_dotenv()

logger = logging.getLogger("uvicorn.error")

# SMTP Configuration defaults (can be overridden via environment variables)
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SENDER_EMAIL = os.getenv("SENDER_EMAIL", SMTP_USERNAME or "noreply@itu.edu.pk")
BREVO_API_KEY = os.getenv("BREVO_API_KEY", "")
BREVO_URL = "https://api.brevo.com/v3/smtp/email"
SENDER_NAME = os.getenv("SENDER_NAME", "ITU Lahore Portal")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173/login")

def generate_secure_password(length: int = 10) -> str:
    """
    Generates a secure, human-friendly random password containing:
    uppercase, lowercase, digits, and a special character.
    """
    if length < 8:
        length = 10
    
    uppercase = string.ascii_uppercase
    lowercase = string.ascii_lowercase
    digits = string.digits
    special = "!@#$%^&*"
    
    # Ensure at least one character from each set
    password = [
        secrets.choice(uppercase),
        secrets.choice(lowercase),
        secrets.choice(digits),
        secrets.choice(special)
    ]
    
    # Fill remainder
    all_chars = uppercase + lowercase + digits + special
    password += [secrets.choice(all_chars) for _ in range(length - 4)]
    secrets.SystemRandom().shuffle(password)
    return "".join(password)

def send_welcome_email(name: str, email: str, password: str, role: str = "student", portal_url: str = FRONTEND_URL) -> bool:
    """
    Sends an automated welcome email with login credentials using SMTP.
    If credentials are not yet configured in environment variables, it logs the email safely
    without crashing the user registration process.
    """
    role_label = role.capitalize()
    safe_name = html.escape(name)
    subject = f"🎓 Welcome to ITU {role_label} Portal - Your Account Credentials"

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: 'Segoe UI', Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }}
        .card {{ max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }}
        .header {{ background: linear-gradient(135deg, #0284c7 0%, #0f766e 100%); padding: 32px 24px; text-align: center; color: #ffffff; }}
        .header h1 {{ margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }}
        .header p {{ margin: 6px 0 0; opacity: 0.9; font-size: 14px; }}
        .content {{ padding: 28px 24px; }}
        .credential-box {{ background-color: #f1f5f9; border-radius: 8px; border: 1px dashed #cbd5e1; padding: 18px; margin: 20px 0; }}
        .cred-item {{ display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }}
        .cred-item:last-child {{ margin-bottom: 0; }}
        .cred-label {{ color: #64748b; font-weight: 500; }}
        .cred-value {{ color: #0f172a; font-weight: 700; font-family: 'Consolas', monospace; }}
        .btn {{ display: inline-block; background-color: #0284c7; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: 600; font-size: 14px; margin-top: 16px; text-align: center; }}
        .footer {{ text-align: center; padding: 18px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; color: #94a3b8; font-size: 12px; }}
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1>ITU Lahore {role_label} Portal</h1>
          <p>Official Account Notification</p>
        </div>
        <div class="content">
          <p>Dear <strong>{safe_name}</strong>,</p>
          <p>Congratulations and welcome! Your {role} profile has been registered in the ITU Lahore Portal. Below are your account login details:</p>
          
          <div class="credential-box">
            <div class="cred-item">
              <span class="cred-label">Portal URL:</span>
              <span class="cred-value">{portal_url}</span>
            </div>
            <div class="cred-item">
              <span class="cred-label">Registered Email:</span>
              <span class="cred-value">{email}</span>
            </div>
            <div class="cred-item">
              <span class="cred-label">Temporary Password:</span>
              <span class="cred-value">{password}</span>
            </div>
          </div>

          <p style="font-size: 13px; color: #64748b;">
            💡 <em>For security reasons, you will be prompted to update this password upon your first sign in.</em>
          </p>

          <center>
            <a href="{portal_url}" class="btn">Log In to ITU Portal</a>
          </center>
        </div>
        <div class="footer">
          Information Technology University, Lahore &bull; Burki Road Campus<br>
          If you did not expect this invitation, please notify administration.
        </div>
      </div>
    </body>
    </html>
    """

    plain_content = f"""
Dear {name},

Welcome to ITU Lahore! Your {role} account has been created.

Login Credentials:
Portal URL: {portal_url}
Email: {email}
Temporary Password: {password}

Please log in and update your password on your first sign in.

ITU Lahore Administration
"""

    try:
        if BREVO_API_KEY:
            send_with_brevo(name, email, subject, html_content)
        elif SMTP_USERNAME and SMTP_PASSWORD:
            send_with_smtp(email, subject, plain_content, html_content)
        else:
            logger.warning(
                f"[EMAIL SIMULATION] No email provider configured, nothing sent to {email}. "
                f"Set BREVO_API_KEY, or SMTP_USERNAME and SMTP_PASSWORD, in your environment."
            )
            return False

        logger.info(f"Welcome email accepted for {email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send welcome email to {email}: {str(e)}")
        return False


def send_with_brevo(name: str, email: str, subject: str, html_content: str) -> None:
    """HTTPS API. Hosts such as Render and Railway block SMTP ports, but not port 443."""
    response = httpx.post(
        BREVO_URL,
        headers={"api-key": BREVO_API_KEY, "accept": "application/json"},
        json={
            "sender": {"name": SENDER_NAME, "email": SENDER_EMAIL},
            "to": [{"email": email, "name": name}],
            "subject": subject,
            "htmlContent": html_content,
        },
        timeout=20,
    )

    if response.status_code >= 400:
        raise RuntimeError(f"Brevo returned {response.status_code}: {response.text[:200]}")


def send_with_smtp(email: str, subject: str, plain_content: str, html_content: str) -> None:
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{SENDER_NAME} <{SENDER_EMAIL}>"
    msg["To"] = email

    msg.attach(MIMEText(plain_content, "plain"))
    msg.attach(MIMEText(html_content, "html"))

    with smtplib.SMTP(SMTP_SERVER, SMTP_PORT, timeout=20) as server:
        server.ehlo()
        server.starttls()
        server.login(SMTP_USERNAME, SMTP_PASSWORD)
        server.sendmail(SENDER_EMAIL, [email], msg.as_string())
