import TopAppBar from '../components/TopAppBar';
import EditorSurface from '../components/EditorSurface';
import FooterStatusBar from '../components/FooterStatusBar';

export default function EditorPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)] flex flex-col">
      <TopAppBar />
      <EditorSurface />
      <FooterStatusBar />
    </div>
  );
}
