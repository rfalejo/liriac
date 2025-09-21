import EditorPage from './pages/EditorPage';
import { ThemeProvider } from './theme';
import Toasts from './components/Toasts';
import { AppStoreProvider } from './store/appStore';

export default function App() {
  return (
    <AppStoreProvider>
      <ThemeProvider>
        <EditorPage />
        <Toasts />
      </ThemeProvider>
    </AppStoreProvider>
  );
}
