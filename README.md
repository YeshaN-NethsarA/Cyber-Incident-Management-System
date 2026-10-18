🛡️ Cyber Incident Management System


  A secure API-based system for managing and tracking cybersecurity incidents.
<p align="center">
  <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white" alt="JWT" />
  <img src="https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/bcrypt-003A70?style=for-the-badge&logo=letsencrypt&logoColor=white" alt="bcrypt" />
</p>

📌 Overview

The Cyber Incident Management System is a cybersecurity project designed to manage cyber incidents through a secure API. It implements authentication, access control, password hashing, and user data isolation.

✨ Features

- 🔐 Secure user authentication
- 🎟️ JWT-based authorization
- 🛡️ Protected API endpoints
- 🔑 Password hashing with bcrypt
- 👤 User-specific data access
- 🚨 Cyber incident management
- 🧪 Security testing and validation

🧰 Technology Stack

Technology| Purpose
Python| Backend development
MongoDB| Database
JWT| Authentication and authorization
bcrypt| Password hashing
REST API| Client-server communication

🔒 Security Testing

Test| Result
API access without token| "401 Unauthorized"
Invalid JWT token| "401 Unauthorized"
Incorrect password| Rejected
Password storage| bcrypt hash verified
User isolation| Test account created; isolation verification pending

⚙️ Installation

1. Clone the repository

git clone YOUR_GITHUB_REPOSITORY_URL
cd YOUR_PROJECT_FOLDER

2. Create a virtual environment

python -m venv venv

3. Activate the environment

Windows

venv\Scripts\activate

4. Install dependencies

pip install -r requirements.txt

5. Configure environment variables

Configure the required environment variables according to your project settings. Keep secrets in your local ".env" file and never upload them to GitHub.

6. Run the application

Use the startup command specified by your backend framework and project configuration.

📁 Project Structure

Cyber-Incident-Management-System/
├── README.md
├── requirements.txt
├── .gitignore
├── [application source files]
└── [tests]

Replace the example structure above with the actual files and folders in your repository.

🔐 Security Notice

- Never commit passwords, API keys, JWT secrets, or database credentials.
- Keep ".env" files out of version control.
- Use ".env.example" for placeholder configuration values only.
- Test authorization and user isolation before deploying the application.

🚀 Project Status

Status: Development

This project is intended for cybersecurity learning, API security testing, and portfolio demonstration.

👨‍💻 Author

W.T.Y Nethsara

Cybersecurity | Networking | Python Development

---

<p align="center">
  ⭐ If you find this project useful, consider giving it a star!
</p>