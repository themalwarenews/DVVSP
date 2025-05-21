# DVVH: Deliberately Vulnerable Video Hosting

A video hosting and streaming web application for security training, inspired by Vimeo. Built with Next.js (React), Tailwind CSS, Node.js (Express), MySQL, and AWS S3. Intentionally includes common web vulnerabilities for educational purposes.

## Features
- User registration, login, and OAuth (Google, Facebook)
- Video upload, transcoding, thumbnail generation, and streaming
- Comments, likes, watch later, favorites
- User profiles, public/private videos
- Search and admin panel
- Intentionally vulnerable endpoints for security research

## Quick Start
1. Clone the repo
2. Configure environment variables (see .env.example)
3. Run `docker-compose up --build`
4. Access frontend at http://localhost:3000 and backend at http://localhost:4000

## Documentation
- See `docs/vulnerabilities.txt` for a list of included vulnerabilities
- See `db/schema.sql` for the database schema

## Disclaimer
This project is for educational and research purposes only. Do not deploy in production environments.
