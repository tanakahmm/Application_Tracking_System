# AI Chat Feature - User Guide

## 🎯 Overview

The AI Chat feature is now integrated into your ATS system! It appears as a **floating chat button** in the bottom-right corner of every page after login.

## ✨ Features

- **Floating Button**: Always accessible from any page (bottom-right corner)
- **Role-Aware**: Only shows when user is logged in
- **Context-Engineering**: AI answers are based ONLY on ATS data the user has access to
- **Beautiful UI**: Modern chat interface with smooth animations
- **Auto-Scroll**: Messages automatically scroll to show latest responses

## 🚀 How to Use

### For Users:

1. **Login** to your ATS account (Admin, Recruiter, or Client)
2. **Look for the floating button** in the bottom-right corner (indigo/purple circular button with chat icon)
3. **Click the button** to open the AI chat window
4. **Ask questions** like:
   - "Show candidates in final round for requirement R-123"
   - "What is the status of candidate Prajith?"
   - "List all open requirements for client XYZ"
   - "Show interviews scheduled for next week"

### Example Queries:

- **Candidates**: "Show me candidates", "Find candidate named John", "Candidates in final round"
- **Requirements**: "Show requirements", "List open requirements", "Requirements for client ABC"
- **Interviews**: "Upcoming interviews", "Interviews for candidate X"
- **Status Updates**: "Status of candidate Y", "What's the progress on requirement R-456"

## 🔒 Security & Access Control

The AI respects your role permissions:

- **Admin**: Can see all data across the system
- **Recruiter**: Can see candidates/requirements they created or are allocated to
- **Client**: Can only see their own requirements and related candidates

If you ask about data you don't have access to, the AI will politely refuse.

## 📁 File Locations

### Frontend:
- `src/components/FloatingAiChat.jsx` - Main chat component (floating button + modal)
- `src/components/AiChat.jsx` - Original chat component (can be used standalone if needed)
- `src/App.jsx` - Added `<FloatingAiChat />` to render on all pages

### Backend:
- `controllers/ai_chat_controller.py` - `/api/ai/chat` endpoint
- `services/ai_data_service.py` - Role-aware data fetching
- `utils/llm_client.py` - LLM integration (Groq)

## 🎨 UI Details

- **Button**: Circular, indigo/purple, fixed position bottom-right
- **Chat Window**: Opens as a modal overlay (mobile-friendly)
- **Messages**: User messages (right, indigo), AI messages (left, white)
- **Loading**: Animated dots while AI is thinking
- **Close**: Click X button or click outside the chat window

## 🔧 Technical Implementation

1. **Context Engineering Flow**:
   - User sends message → Backend detects intent (candidate/requirement/client)
   - Fetches ATS data with role-based filtering
   - Builds structured context JSON
   - Sends to LLM (Groq) with system prompt
   - Returns natural-language answer

2. **System Prompt**: Instructs AI to ONLY use provided context, never invent data

3. **Error Handling**: Graceful fallbacks if LLM fails or data unavailable

## 🐛 Troubleshooting

- **Button not showing?** Make sure you're logged in
- **Chat not responding?** Check backend is running on `http://127.0.0.1:5000`
- **Empty responses?** Check browser console for errors, verify backend logs
- **Access denied?** Normal - AI respects your role permissions

## 📝 Notes

- Chat history is not persisted (resets on page refresh)
- All answers are generated from your ATS database, not external sources
- The AI will not invent or hallucinate data - if it's not in the context, it will say so

