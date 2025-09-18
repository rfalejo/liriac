import { useParams } from 'react-router-dom';

export function EditorPage() {
  const { bookId, chapterId } = useParams<{ bookId: string; chapterId: string }>();
  return (
    <section aria-labelledby="editor-heading" className="space-y-4">
      <h2 id="editor-heading" className="text-2xl font-semibold">
        Editor
      </h2>
      <p className="text-gray-600">
        Book ID: {bookId} — Chapter ID: {chapterId}
      </p>
      <div className="rounded-md border p-4 text-sm text-gray-500 bg-white">
        Editor workspace placeholder
      </div>
    </section>
  );
}

export default EditorPage;
