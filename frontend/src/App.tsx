import { CssBaseline, ThemeProvider } from "@mui/material";
import { LibraryLanding } from "./features/library/LibraryLanding";
import { theme } from "./theme";

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LibraryLanding />
    </ThemeProvider>
  );
}

export default App;
