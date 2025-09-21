import EditorPage from './pages/EditorPage';
import { ThemeProvider } from './theme';
import Toasts from './components/Toasts';

export default function App() {

  return (
    <ThemeProvider>
      <EditorPage />
      <Toasts />
    </ThemeProvider>
  );
}
