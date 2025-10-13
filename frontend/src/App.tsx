import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
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
