def get_html_wrapper(content: str) -> str:
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1a1a1a; margin: 0; padding: 0; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 40px 20px; }}
            .header {{ margin-bottom: 30px; }}
            .logo {{ font-size: 24px; font-weight: bold; color: #0ea5e9; text-decoration: none; }}
            .content {{ background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 30px; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1); }}
            .footer {{ margin-top: 30px; font-size: 12px; color: #6b7280; text-align: center; }}
            .button {{ display: inline-block; background: #0ea5e9; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 20px; }}
            .otp-code {{ font-size: 32px; font-weight: 800; letter-spacing: 4px; color: #0ea5e9; margin: 20px 0; }}
            .submission-item {{ margin-bottom: 20px; border-bottom: 1px solid #f3f4f6; padding-bottom: 10px; }}
            .submission-label {{ font-size: 14px; color: #6b7280; margin-bottom: 4px; }}
            .submission-value {{ font-size: 16px; font-weight: 500; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">FormBar</div>
            </div>
            <div class="content">
                {content}
            </div>
            <div class="footer">
                &copy; {2026} FormBar. All rights reserved.
            </div>
        </div>
    </body>
    </html>
    """


def get_otp_template(otp: str) -> str:
    content = f"""
    <h1 style="font-size: 20px; margin-bottom: 16px;">Verify your email</h1>
    <p>Use the following code to sign in to your FormBar account. This code will expire in 10 minutes.</p>
    <div class="otp-code">{otp}</div>
    <p style="font-size: 14px; color: #6b7280;">If you didn't request this code, you can safely ignore this email.</p>
    """
    return get_html_wrapper(content)


def get_submission_template(form_name: str, answers: list[dict]) -> str:
    items_html = ""
    for item in answers:
        val_display = item["value"]
        if item.get("is_file"):
            val_display = f"""
            <div style="margin-top: 8px;">
                <a href="{item['value']}" class="button" style="margin-top: 0; padding: 8px 16px; font-size: 14px;">
                    View {item.get('filename', 'File')}
                </a>
            </div>
            """

        items_html += f"""
        <div class="submission-item">
            <div class="submission-label">{item['label']}</div>
            <div class="submission-value">{val_display}</div>
        </div>
        """

    content = f"""
    <h1 style="font-size: 20px; margin-bottom: 16px;">New submission for {form_name}</h1>
    <p>Here's a summary of the responses:</p>
    <div style="margin-top: 24px;">
        {items_html}
    </div>
    """
    return get_html_wrapper(content)
