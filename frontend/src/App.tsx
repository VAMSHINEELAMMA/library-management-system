import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Books from "./pages/Books";
import MyBorrows from "./pages/MyBorrows";
import Fines from "./pages/Fines";
import Members from "./pages/Members";
import Reservations from "./pages/Reservations";
import AddBook from "./pages/AddBook";
import EditBook from "./pages/EditBook";
import Reports from "./pages/Reports";
import EBooks from "./pages/EBooks";
import Chatbot from "./components/Chatbot";
import AIRecommendations from "./pages/AIRecommendations";
import SmartSearch from "./pages/SmartSearch";
import ReadingAnalytics from "./pages/ReadingAnalytics";
import OverduePrediction from "./pages/OverduePrediction";
import FineWaiver from "./pages/FineWaiver";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

const theme = createTheme({
  palette: {
    primary: {
      main: "#5D4037",
      light: "#8D6E63",
      dark: "#3E2723",
      contrastText: "#FFF8E1"
    },
    secondary: {
      main: "#FF8F00",
      light: "#FFB300",
      dark: "#E65100",
      contrastText: "#ffffff"
    },
    background: {
      default: "#FFF8E1",
      paper: "#FFFFFF"
    },
    text: {
      primary: "#3E2723",
      secondary: "#6D4C41"
    }
  },
  typography: {
    fontFamily: '"Georgia", "Times New Roman", serif',
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: "8px",
          textTransform: "none",
          fontWeight: 600
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(93,64,55,0.15)"
        }
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: "linear-gradient(135deg, #3E2723 0%, #5D4037 50%, #795548 100%)",
          boxShadow: "0 2px 10px rgba(62,39,35,0.3)"
        }
      }
    }
  }
});

function App(): React.ReactElement {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/books" element={<Books />} />
          <Route path="/my-borrows" element={<MyBorrows />} />
          <Route path="/fines" element={<Fines />} />
          <Route path="/members" element={<Members />} />
          <Route path="/reservations" element={<Reservations />} />
          <Route path="/add-book" element={<AddBook />} />
          <Route path="/edit-book/:id" element={<EditBook />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/ebooks" element={<EBooks />} />
          <Route path="/ai-recommendations" element={<AIRecommendations />} />
          <Route path="/smart-search" element={<SmartSearch />} />
          <Route path="/reading-analytics" element={<ReadingAnalytics />} />
          <Route path="/overdue-prediction" element={<OverduePrediction />} />
          <Route path="/fine-waiver" element={<FineWaiver />} />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
        <Chatbot />
      </Router>
    </ThemeProvider>
  );
}

export default App;
