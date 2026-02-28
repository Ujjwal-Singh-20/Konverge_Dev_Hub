# Konverge

**Konverge** is a next-generation, real-time collaboration platform built entirely around the developer workflow. It eliminates friction by integrating communication, coding, and artificial intelligence into one seamless environment. Designed for teams who need to brainstorm, write code, and iterate rapidly without ever leaving their workspace.

## 🚀 Major Features

- **AI-Powered Pair Programming & Diff View:** An integrated AI assistant that understands your codebase. It doesn't just return text snippets; it suggests context-aware modifications and presents them in a beautiful, side-by-side **Monaco Diff Editor** right next to your chat.
- **Dedicated Code Editor Per Room:** Every chat room is paired with its own fully-featured code editor (powered by Monaco). Chat about logic on the left and write actual code on the right, simultaneously.
- **Real-Time, Fluid Chat Hub:** Instant, low-latency messaging with dynamic room creation for instant collaboration.
- **Integrated File Management:** Securely share, store, and access project files and assets directly within your chat rooms.
- **Seamless Google Authentication:** Frictionless and secure onboarding using Google Auth, complete with robust user profile management.
- **Developer-Centric Aesthetics:** A stunning, modern UI featuring a subtle, mathematical tile-shimmer background animation designed to maintain focus and reduce eye strain during long coding sessions.

## ✨ How It Works Seamlessly (With Examples)

Konverge is designed to keep you in the flow state. Here's how the features interact to create a unified experience:

### Example Scenario: Debugging and Fixing a Bug Together

1. **Creating the Space:** 
   Alice and Bob encounter a bug in their latest deployment. Alice logs in via **Google Auth**, creates a new room named `Bug-Fix-Auth`, and invites Bob.
   
2. **Context Sharing & File Uploads:**
   Bob drags and drops the server error logs straight into the chat via **Integrated File Management**. Alice instantly receives them and views the logs without switching tabs.

3. **Coding & Discussing in Real-Time:**
   Alice opens the room's **Dedicated Code Editor** and pastes the problematic authentication middleware code. As she scrolls through the code, Bob messages her in the adjacent chat window: *"I think the token verification fails on line 42."*

4. **Invoking the AI Assistant:**
   Instead of opening ChatGPT in a new window, Bob tags the **AI Assistant** directly in the chat, asking: *"Fix the token expiration logic in the current code."*

5. **Reviewing the Diff:**
   The AI analyzes the code in the editor and proposes a fix. Instead of a messy text block in the chat, the AI triggers the **Diff View**. A side-by-side Monaco Diff Editor directly appears, clearly highlighting the removed faulty logic in red and the new, secure validation in green. 

6. **Applying the Changes:**
   Alice and Bob review the diff visually. It looks perfect. Alice clicks the **"Accept"** button on the AI's suggestion. The room's main code editor instantly updates with the new code. They are now ready to commit their changes.

---

## 🛠️ Tech Stack Overview

- **Frontend:** React.js, Monaco Editor (for rich code editing & diff views)
- **Backend:** Node.js, Express.js
- **Services:** Real-time WebSockets integration, AI Service integrations, Google OAuth
- **Styling:** Custom CSS with modern, dark-mode developer aesthetics

## ⚙️ Getting Started

### Prerequisites
- Node.js (v16+)
- npm or yarn

### Installation & Running Locally

1. Install dependencies for both the frontend and the backend.
2. Configure your environment variables in the `server` folder (e.g., Google Client ID/Secret, AI API keys).
3. Start the application:
   ```bash
   # Terminal 1: Start the frontend
   npm run dev

   # Terminal 2: Start the backend server
   cd server
   node server.js
   ```
