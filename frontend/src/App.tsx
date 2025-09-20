import EditorPage from './pages/EditorPage';
import { ThemeProvider } from './theme';

export default function App() {
  return (
    <ThemeProvider>
      <EditorPage />
    </ThemeProvider>
  );
}
