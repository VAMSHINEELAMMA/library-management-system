import React, { useState } from "react";
import axios from "axios";
import {
  Box, Paper, Typography, TextField,
  Button, IconButton, Fab
} from "@mui/material";
import ChatIcon from "@mui/icons-material/Chat";
import CloseIcon from "@mui/icons-material/Close";
import SendIcon from "@mui/icons-material/Send";

interface Message {
  role: "user" | "bot";
  text: string;
}

const RESPONSES: { [key: string]: string } = {
  "hello": "Hello! Welcome to the Library. How can I help you today?",
  "hi": "Hi there! How can I assist you with the library?",
  "how to borrow": "To borrow a book: Go to Browse Books, find your book and click the Borrow button. You have 14 days to return it.",
  "borrow": "To borrow a book: Go to Browse Books, find your book and click the Borrow button. You have 14 days to return it.",
  "return": "To return a book: Go to My Borrowings and click the Return Book button next to the book you want to return.",
  "how to return": "To return a book: Go to My Borrowings and click the Return Book button next to the book you want to return.",
  "fine": "Fines are Rs. 5 per day for overdue books. You can pay fines in the My Fines section.",
  "fines": "Fines are Rs. 5 per day for overdue books. You can pay fines in the My Fines section.",
  "reserve": "To reserve a book: Go to Browse Books, find an unavailable book and click Reserve. You will be notified when it becomes available.",
  "reservation": "To reserve a book: Go to Browse Books, find an unavailable book and click Reserve.",
  "ebook": "You can access E-Books from the E-Books section. Download PDF files directly to your device!",
  "ebooks": "You can access E-Books from the E-Books section. Download PDF files directly to your device!",
  "download": "Go to E-Books section and click Download PDF on any book you want.",
  "membership": "Your membership started on your registration date. You can borrow up to books at a time.",
  "help": "I can help you with: borrowing books, returning books, fines, reservations, e-books. What would you like to know?",
  "due date": "Books are due 14 days after borrowing. You can check due dates in My Borrowings.",
  "opening hours": "The library is open Monday to Saturday, 9 AM to 6 PM.",
  "contact": "You can contact the library at library@example.com or call 1800-LIB-HELP.",
  "bye": "Goodbye! Happy reading!",
  "thank you": "You are welcome! Happy reading!",
  "thanks": "You are welcome! Feel free to ask if you need more help."
};

const getResponse = (message: string): string => {
  const lower = message.toLowerCase();
  for (const key of Object.keys(RESPONSES)) {
    if (lower.includes(key)) {
      return RESPONSES[key];
    }
  }
  return "I am not sure about that. You can ask me about: borrowing books, returning books, fines, reservations, e-books, or type help for more options.";
};

const Chatbot: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", text: "Hello! I am your Library Assistant. How can I help you today? Type help to see what I can do!" }
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: "user", text: input };
    const botResponse: Message = { role: "bot", text: getResponse(input) };

    setMessages(prev => [...prev, userMessage, botResponse]);
    setInput("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSend();
  };

  return (
    <>
      <Fab
        color="primary"
        onClick={() => setOpen(!open)}
        sx={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 1000,
          bgcolor: "#5D4037",
          "&:hover": { bgcolor: "#3E2723" }
        }}
      >
        {open ? <CloseIcon /> : <ChatIcon />}
      </Fab>

      {open && (
        <Paper elevation={8} sx={{
          position: "fixed",
          bottom: 90,
          right: 24,
          width: 340,
          height: 450,
          zIndex: 1000,
          borderRadius: 3,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden"
        }}>
          <Box sx={{
            background: "linear-gradient(135deg, #3E2723, #5D4037)",
            p: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <ChatIcon sx={{ color: "white" }} />
              <Typography variant="h6" sx={{ color: "white", fontSize: "1rem" }}>
                Library Assistant
              </Typography>
            </Box>
            <IconButton size="small" onClick={() => setOpen(false)}
              sx={{ color: "white" }}>
              <CloseIcon />
            </IconButton>
          </Box>

          <Box sx={{
            flex: 1,
            overflowY: "auto",
            p: 2,
            bgcolor: "#FFF8E1",
            display: "flex",
            flexDirection: "column",
            gap: 1
          }}>
            {messages.map((msg, i) => (
              <Box key={i} sx={{
                display: "flex",
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start"
              }}>
                <Box sx={{
                  maxWidth: "80%",
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: msg.role === "user" ? "#5D4037" : "white",
                  color: msg.role === "user" ? "white" : "#3E2723",
                  boxShadow: 1
                }}>
                  <Typography variant="body2">{msg.text}</Typography>
                </Box>
              </Box>
            ))}
          </Box>

          <Box sx={{
            p: 1.5,
            borderTop: "1px solid #e0e0e0",
            display: "flex",
            gap: 1,
            bgcolor: "white"
          }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Type a message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3 } }}
            />
            <Button
              variant="contained"
              onClick={handleSend}
              sx={{ minWidth: 44, bgcolor: "#5D4037", "&:hover": { bgcolor: "#3E2723" } }}
            >
              <SendIcon />
            </Button>
          </Box>
        </Paper>
      )}
    </>
  );
};

export default Chatbot;
