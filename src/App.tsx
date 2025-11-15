import AppRouter from "./routes/AppRouter";
import "./App.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import ChatboxAI, { type ChatMessage } from "./components/common/ChatboxAI";
import { askChatbot } from "./api/chatbot";
import { SocketProvider } from "./contexts/SocketContext";

const theme = createTheme({
  palette: {
    primary: {
      main: "#116ce4ff",
    },
    secondary: {
      main: "#ffd43b",
    },
  },
});

function App() {
  return (
    <SocketProvider>
      <ThemeProvider theme={theme}>
        <AppRouter />
        {/* Minimal Notion-like AI chatbox wired to backend */}
        <ChatboxAI
          title="Ask Grande AI"
          onAsk={async (prompt: string, history: ChatMessage[]) => {
            // Map our internal history to API's expected shape
            const compact = history.map(h => ({ role: h.role, content: h.content }));
            return askChatbot(prompt, compact);
          }}
        />
        <ToastContainer
          position="top-center"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          pauseOnHover
          draggable
          theme="colored"
        />
      </ThemeProvider>
    </SocketProvider>
  );
}

export default App;
