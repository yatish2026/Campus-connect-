# 💼 Campus Connect

**Campus Connect** is a modern, full-stack professional networking web application built using the **MERN stack** (MongoDB, Express, React, Node).  
It’s a LinkedIn-style sandbox that helps users create profiles, share posts, connect with peers, and discover clubs and resources — perfect for demos, learning full-stack concepts, and building real-world prototypes.

---

## 🎯 What We Offer

- Developer-friendly social feed: create posts (with optional image uploads), like, comment, share, and delete.
- Rich profiles: profile picture, banner, headline, about section, experience, education, skills, and project showcase.
- Connections model: send, accept, or reject requests and view connection statuses.
- Clubs and communities: create and follow clubs, post in feeds (membership checks enforced).
- Notifications: real-time in-app notifications for likes, comments, and connections.
- Authentication: Email/password registration + Google sign-in with JWT cookie/token handling.
- Media uploads: Cloudinary integration for image storage.
- Email hooks: Mailtrap-ready templates for welcome/comment notifications.
- Responsive UI: TailwindCSS + DaisyUI, fully optimized for desktop and mobile.

---

## 🚀 Full Feature List (Expanded)

### 🔐 Authentication
- Signup / Login / Logout
- JWT tokens stored in cookies and client-side storage
- Google OAuth integration
- Protected routes for authenticated users

### 👤 Profiles
- Edit name, headline, about, skills, education, and experience
- Upload profile and banner images via Cloudinary
- Add LinkedIn/GitHub links and projects
- View other users’ profiles and posts

### 📰 Posts
- Create text or image posts
- Like / Unlike posts
- Comment and notify post authors
- Delete your own posts
- Feed includes content from connections and followed clubs

### 🤝 Connections
- Send / Accept / Reject requests
- Remove connections
- Suggested connections algorithm

### 🏫 Clubs
- Follow and create clubs
- Post in club feeds (if a member)
- Manage club members and posts

### 🔔 Notifications
- Store notifications in DB for likes, comments, and club updates
- Optional email notifications (Mailtrap integration)

### ⚙️ Developer Experience
- React Query for data caching
- Modular backend: controllers, routes, and models
- Example seed scripts for quick dev setup

---

## 🧩 
Built with ❤️ by Professor Yatish and team — pushing the limits of full-stack innovation.