import {
  Box,
  Button,
  CssBaseline,
  ThemeProvider,
  Typography,
  createTheme,
} from "@mui/material";

const theme = createTheme();

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{ minHeight: "100vh", display: "grid", placeItems: "center", p: 4 }}
      >
        <Box textAlign="center">
          <Typography variant="h3" component="h1" gutterBottom>
            Welcome to Liriac
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Start building with Material UI.
          </Typography>
          <Button variant="contained" color="primary">
            Explore
          </Button>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
