import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout, LibraryPage, EditorPage, NotFoundPage } from './app/routes';

function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<LibraryPage />} />
          <Route path="/books/:bookId/chapters/:chapterId" element={<EditorPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}

export default App;
