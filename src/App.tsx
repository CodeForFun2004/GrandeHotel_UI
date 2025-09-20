import AppRouter from "./routes/AppRouter";
import "./App.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { createTheme, ThemeProvider } from "@mui/material/styles";

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
    <>
      <ThemeProvider theme={theme}>
        <AppRouter />
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
    </>
  );
}

export default App;