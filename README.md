# 📄 Smart Document Extraction (DocScanner.ai)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FChogunlnwza%2FSmart-Document-Extraction&env=VITE_SUPABASE_URL,VITE_SUPABASE_ANON_KEY,VITE_GEMINI_API_KEY)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Gemini](https://img.shields.io/badge/Google%20Gemini-8E75B2?style=for-the-badge&logo=google&logoColor=white)

🌐 **Live Demo:** [https://smart-document-extraction.vercel.app](https://smart-document-extraction.vercel.app)
<div align="center">
  <p> </p>
  <a href="#english">English</a> | <a href="#ภาษาไทย">ภาษาไทย</a>
</div>

---

<h2 id="english">English Version</h2>

**Smart Document Extraction** is an intelligent web application that allows you to scan documents via camera or upload document images to accurately extract key information into a structured format. Powered by **Google Gemini AI** for data extraction and **Supabase** for secure backend storage.

### ✨ Core Features
- **AI Document Extraction:** Automatically extract and structure data from any document type (ID cards, receipts, business cards, etc.) using Gemini 3.5 Flash.
- **Smart Auto-Cropping:** Edge detection and automatic document cropping powered by OpenCV.js.
- **Secure Authentication:** Robust user authentication system (supports Email/Password and Google Sign-in).
- **Private Scan History:** Personal scan history with Row Level Security (RLS) ensuring strict data privacy for each user.
- **Cloud Storage:** Cropped document images are securely uploaded and stored in Supabase Storage.
- **Fully Responsive:** Seamlessly works on both desktop and mobile devices.

---

## 🚀 Installation & Setup (วิธีติดตั้ง)

If you want to run this project locally, follow these steps:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Chogunlnwza/Smart-Document-Extraction.git
   cd Smart-Document-Extraction
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Environment Variables:**
   Create a `.env` file in the root directory and add your API keys:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_GEMINI_API_KEY=your_google_gemini_api_key
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Set up Supabase Database:**
   You will need to run the SQL configuration script in your Supabase SQL Editor to create the `documents` table and enable RLS policies (Refer to the source code for the schema).

## 🛠 Tech Stack
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Lucide React
- **Backend & Database:** Supabase (PostgreSQL, Auth, Storage)
- **AI Model:** Google Generative AI (Gemini Flash)
- **Computer Vision:** OpenCV.js
- **Deployment:** Vercel / GitHub Pages

---
<h2 id="ภาษาไทย">ภาษาไทย</h2>

**Smart Document Extraction** เป็นเว็บแอปพลิเคชันอัจฉริยะที่ช่วยให้คุณสามารถสแกนเอกสารด้วยกล้อง หรืออัปโหลดรูปภาพเอกสาร เพื่อดึงข้อมูลสำคัญออกมาจัดเรียงในรูปแบบโครงสร้าง (JSON/Key-Value) ได้อย่างแม่นยำ โดยใช้ขุมพลังของ **Google Gemini AI** ควบคู่กับการจัดเก็บข้อมูลอย่างปลอดภัยด้วย **Supabase**

### ✨ ฟีเจอร์หลัก (Features)
- **AI Document Extraction:** ดึงข้อมูลจากเอกสารทุกประเภท (บัตรประชาชน, ใบเสร็จ, นามบัตร, ฯลฯ) และวิเคราะห์โครงสร้างข้อมูลอัตโนมัติด้วย Gemini 3.5 Flash
- **Smart Auto-Cropping:** ตรวจจับขอบกระดาษและครอปรูปให้อัตโนมัติด้วยเทคโนโลยี OpenCV.js
- **Secure Authentication:** ระบบลงทะเบียนและเข้าสู่ระบบที่ปลอดภัย (รองรับ Email/Password และ Sign in with Google)
- **Private Scan History:** ประวัติการสแกนจะถูกจัดเก็บแยกตามบัญชีผู้ใช้งาน พร้อมระบบ Row Level Security (RLS) ปกป้องข้อมูลส่วนตัว
- **Cloud Storage:** อัปโหลดและเก็บรูปภาพเอกสารที่ถูกครอปแล้วไว้บน Supabase Storage
- **Fully Responsive:** ใช้งานได้ไหลลื่นทั้งบนคอมพิวเตอร์และกล้องโทรศัพท์มือถือ

---

*Developed with Panuwit*
