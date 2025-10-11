import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { LibraryLanding } from "./features/library/LibraryLanding";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#58a6ff",
    },
    background: {
      default: "#0d1117",
      paper: "#161b22",
    },
  },
  shape: {
    borderRadius: 16,
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LibraryLanding />
    </ThemeProvider>
  );
}

export default App;
