import TopAppBar from '../components/TopAppBar';
import EditorSurface from '../components/EditorSurface';
import FooterStatusBar from '../components/FooterStatusBar';

export default function EditorPage() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100 flex flex-col">
      <TopAppBar />
      <EditorSurface />
      <FooterStatusBar />
    </div>
  );
}
