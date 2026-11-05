import sys
from email_service import send_welcome_email, generate_secure_password

def run_test(recipient_email):
    print(f"[*] Testing email dispatch to: {recipient_email}")
    temp_pass = generate_secure_password(10)
    success = send_welcome_email(
        name="Test Student",
        email=recipient_email,
        password=temp_pass
    )
    if success:
        print(f"[SUCCESS] Email provider accepted the message for {recipient_email}.")
    else:
        print("[!] FAILED: Check your email provider settings.")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit("Usage: python test_email.py recipient@example.com")

    run_test(sys.argv[1])
