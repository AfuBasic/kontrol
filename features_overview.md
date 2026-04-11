# Kontrol - System Features Overview

This document provides a comprehensive breakdown of the core modules and features currently implemented in the **Kontrol** estate management platform.

---

## 🏢 Admin Module (Estate Management)
*The centralized command center for estate managers, HOAs, and administrative staff.*

### 📊 Analytics & Reporting
- **Estate Analytics Dashboard**: Real-time visualization of estate occupancy, active security personnel, and financial health metrics.
- **Activity Logs**: System-wide audit trail tracking every administrative action for complete accountability.

### 👥 Resident Management
- **Approval Portal**: A structured workflow for reviewing, approving, or rejecting new resident sign-up applications with automated email feedback.
- **Secure Invitations**: Generation of unique, time-limited onboarding links to invite residents directly.
- **Resident Directory**: A filterable database of all residents with status tracking, household details, and contact information.

### 📢 Communication Hub
- **Estate Board**: Centralized announcement system allowing admins to broadcast updates with rich media/image support.
- **Comment Moderation**: Ability to manage and respond to resident discussions on estate-wide announcements.

### 💳 Financial Management
- **Automated Invoicing**: System-generated invoices based on active resident counts and the chosen billing period (Quarterly, 6 Months, or Annually).
- **Payment Collection**: Fully integrated Paystack gateway for secure subscription settling.
- **Financial Audit**: Detailed history of all payment transactions (Successful, Pending, Failed).
- **Smart Billing Config**: Ability to toggle between estate-wide charging or per-resident charging models.

### 🔐 Security & Staffing
- **Security Personnel Management**: Dedicated portal to register, manage, and monitor gatehouse personnel.
- **User Access Control**: Role-based access control (RBAC) to manage administrative sub-accounts with granular permissions.

---

## 🏠 Resident Module (Resident Experience)
*Focuses on security, visitor management, and community engagement for homeowners and tenants.*

### 🛡️ Visitor Management
- **Access Code Generation**: Residents can generate secure, 6-digit access codes for their guests directly from the app.
- **Flexible Code Types**: Support for one-time use codes or recurring access for frequent visitors.
- **Real-time Visit Feed**: A personal history showing exactly when guests arrive at and depart from the gate.

### 🗣️ Community Interaction
- **Interactive Notice Board**: Access to all estate announcements with the ability to participate in community discussions.
- **Estate Contacts**: Direct access to estate management, emergency services (police, fire), and facility managers.

### 🤖 Advanced Connectivity
- **Telegram Bot Integration**: A powerful bridge linking the Kontrol account to Telegram, allowing residents to generate codes and receive alerts without opening the web app.

### 👨‍👩‍👧‍👦 Household Control
- **Household Management**: Add and manage family members or dependents under a single primary unit, ensuring consistent access for the entire family.

---

## 🛡️ Security Module (The Gatehouse)
*Streamlined interface designed for quick action and accurate visitor logging by security staff.*

### 🔍 Validation & Entry
- **Quick Code Scanner**: A dedicated validation tool for guards to instantly verify visitor access codes.
- **Digital Visitor Logs**: Real-time logging of entry and exit times, replacing traditional paper-based visitor books.
- **Gate Activity Feed**: A rolling stream of expected visitors and active check-ins for better situational awareness.

---

> [!NOTE]
> This feature list represents the core functionality of the Kontrol V3 ecosystem. Ongoing updates focus on enhancing the "Steeze" UI/UX and deepening automation throughout the billing and security pipelines.
