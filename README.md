# FinPlan Dashboard

**Your Intelligent Financial Planner** 💰

## 🌐 Live Demo
👉 [Visit FinPlan App](https://finplansystem2026.netlify.app/)

FinPlan is a progressive web application (PWA) designed to help you take control of your finances. Track expenses, set financial goals, analyze market trends, and receive personalized recommendations—all in one intuitive dashboard.

---

## 🌟 Features

### 🔐 General System & Authentication
- **User Registration**: Create accounts with validation for unique emails and secure password hashing. Includes 2FA for enhanced security.
- **Secure Login & Logout**: Secure user authentication to access the system and safely end sessions.
- **Session Management**: Ensure users stay logged in securely, utilizing Service Worker caching for fast app loading and offline support.

### 👤 Profile Management
- **View Profile**: Check current personal details (full name, bio, profile picture) and your core financial profile (monthly income, primary financial goals).
- **Update Profile & Personalization**: Interface to modify user details, including a seamless Dark/Light theme toggle.
- **Account Security**: Secure password updates featuring a real-time Password Strength Meter.
- **Data Control**: Securely deactivate or delete user data upon request.

### 🎯 Goal-Based Investment
- **Set Financial Goals**: Create specific objectives (e.g., Retirement, Buying a Home) with target amounts and deadlines.
- **Seamless Management**: Update goals with inline editing and dynamically updating saved amounts, or delete goals as your priorities shift.
- **Goal Tracking & Progress**: Stay motivated with visual, dynamic progress bars and automated target date countdowns (months remaining).

### 📈 Market Insights
- **Live Market News**: Integration with external APIs (e.g., NewsAPI) to fetch and display the latest financial headlines.
- **Stock & Trend Tracker**: Fetch and display live market trends (e.g., via Alpha Vantage API).
- **Interactive News Feed**: Search and filter news by category (Tech, Real Estate, etc.) featuring lazy loading for optimal performance.

### 🧮 Investment Calculator
- **ROI Calculator**: Compare investment options and calculate potential returns over time.
- **Compound Interest Tool**: Specialized sub-calculator for mapping long-term growth and savings projections.
- **Comparison Engine & Export**: Conduct side-by-side comparisons of financial instruments (e.g., Fixed Deposits vs. Stocks) with CSV export support.

### 💡 Recommendations & Visuals
- **Smart Recommendations**: Intelligent engine suggesting investment strategies based on user goals.
- **Visual Dashboard**: Centralized financial overview powered by Chart.js or D3.js.

### 📱 UI/UX & PWA Setup
- **Responsive Design**: Fully responsive UI using Bootstrap.
- **Progressive Web App (PWA)**: Installable app with offline access and fast performance.

---

## 🛠️ Technology Stack

- **Frontend**: JavaScript (63.2%), HTML (30.6%), CSS (6.2%), Bootstrap, Chart.js/D3.js  
- **Backend**: Node.js with Express (configured via `netlify.toml`)  
- **Database**: MongoDB via Mongoose ODM  
- **Email Service**: Nodemailer for notifications  
- **PWA**: Service Worker for offline functionality  
- **Deployment**: Netlify  

---

## 📁 Project Structure

```text
finplan2026/
├── index.html            # Entry point / Loading screen
├── login.html           # User authentication
├── dashboard.html       # Main financial dashboard
├── calculator.html      # Expense & ROI calculator
├── goals.html           # Financial goals tracker
├── market.html          # Market insights & trends
├── recommendations.html  # Personalized recommendations
├── profile.html         # User profile management
├── security.html        # Security settings
├── manifest.json        # PWA configuration
├── sw.js                # Service Worker
├── netlify.toml         # Netlify deployment config
├── package.json         # Backend dependencies
├── package-lock.json    # Dependency lock file
├── css/                # Stylesheets
├── js/                 # JavaScript modules
├── netlify/            # Netlify functions
└── .vscode/            # VS Code settings

🚀 Getting Started
Prerequisites
Node.js (v14 or higher)
npm or yarn
Modern web browser (Chrome, Firefox, Safari, Edge)
Installation

Clone the repository:

git clone https://github.com/yys-beep/finplan2026.git
cd finplan2026

Install dependencies:

npm install
Environment Setup

Create a .env file and configure:

MongoDB connection string
NewsAPI key
Alpha Vantage API key
Email service credentials
Running Locally
npm start

Then open:

http://localhost:3000
🌐 Deployment

This project is configured for Netlify deployment.
Simply push to the main branch and Netlify will automatically build and deploy.

📋 Pages Overview
Page	Purpose
index.html	Loading screen with session check
login.html	User authentication & registration
dashboard.html	Main hub - financial overview
calculator.html	Expense and ROI calculator
goals.html	Financial goals tracker
market.html	Market data and trends
recommendations.html	Investment advice engine
profile.html	User profile management
security.html	Security settings
🔒 Security Features
Session Management (token-based authentication)
Data Encryption & secure password hashing
Two-Factor Authentication (2FA)
HTTPS API communication
User-controlled data deletion
💾 Data Management
Local Storage: Fast session and UI state handling
MongoDB: Persistent backend storage
Service Worker: Offline caching and performance optimization
📱 Progressive Web App (PWA)

FinPlan can be installed like a native app:

iOS: Safari → Share → Add to Home Screen
Android: Chrome → Install App
Desktop: Browser menu → Install
Benefits
Offline access
Fast loading with caching
Native app-like experience
No app store required
