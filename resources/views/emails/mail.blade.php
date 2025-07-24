<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f9f9f9;
            color: #333;
            margin: 0;
            padding: 20px;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #fff;
            border: 1px solid #ddd;
            padding: 20px;
            border-radius: 8px;
        }
        .reset-link {
            color: #007bff;
            text-decoration: none;
            font-size: 16px;
        }
        .reset-link:hover {
            text-decoration: underline;
            color: #0056b3;
        }
        .footer {
            margin-top: 30px;
            font-size: 14px;
            color: #666;
        }
    </style>
</head>
<body>
<div class="email-container">
    <h1>Password Reset Request</h1>
    <p>We received a request to reset your password. If you made this request, please follow the instructions below.</p>
    <p>
        Click the link below to reset your password:
        <a href="{{ $url }}" class="reset-link">Reset Your Password</a>
    </p>
    <p>If the link above doesn’t work, you can contact with admin :</p>
    <p>{{ $url }}</p>
    <p class="footer">
        If you did not request a password reset, no further action is required. If you have any questions or concerns, please contact our support team.
    </p>
    <p class="footer">
        Best regards,<br>
        The Tipic Team
    </p>
</div>

</body>
</html>
