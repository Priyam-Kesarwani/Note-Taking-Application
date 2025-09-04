import { useEffect, useState } from "react";


interface Note {
  id: string;
  content: string;
}

const Dashboard = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [newContent, setNewContent] = useState("");
  const [showForm, setShowForm] = useState(false);

  const fetchNotes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4000/notes', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch notes');
      }

      const data = await response.json();
      console.log('Fetched notes:', data);
      setNotes(data.notes || []);
      setName(data.name || '');    
      setEmail(data.email || ''); 

    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  };


  useEffect(() => {
    fetchNotes();
  }, []);

  const addNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4000/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: newContent }),
      });

      if (!response.ok) {
        throw new Error('Failed to add note');
      }

      const data = await response.json();
      console.log('Added note response:', data);
      // setName(data.name);
      // setEmail(data.email);

      setNewContent('');
      setShowForm(false);
      await fetchNotes(); // Refresh notes after adding

    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

 const deleteNote = async (id: string) => {
  try {
    const token = localStorage.getItem('token');
    console.log('Deleting note with ID:', id); // Debug log

    const response = await fetch(`http://localhost:4000/notes/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete note');
    }

    const data = await response.json();
    console.log('Delete response:', data); // Debug log
    
    setNotes(data.notes);
  } catch (error) {
    console.error('Error deleting note:', error);
  }
};

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      
       <header className="flex justify-between space-x-4 mb-10 md:hidden">
          <img src="/time.png" alt="" />
          <img src="/status.png" alt="" />
        </header>
        
      {/* Header */}
      <header className="flex justify-between items-center p-4 bg-white shadow-md">
        <img src="/image.png" alt="Logo" className="w-8 h-8" />
        <h1 className="text-xl sm:text-2xl font-medium text-gray-800">Dashboard</h1>
        <a href="/signin" className="text-blue-500 underline text-sm sm:text-base">
          Sign Out
        </a>
      </header>

      {/* Welcome Section */}
      <section className="shadow-md p-6 m-4 border-gray-200 border rounded-md text-center bg-white max-w-4xl mx-auto w-full">
        <h1 className="text-2xl sm:text-3xl font-bold py-4">Welcome, {name} !</h1>
        <h3 className="text-base sm:text-lg">Email: {email}</h3>
      </section>

      {/* Notes Section */}
      <main className="flex justify-center items-center flex-grow">
        <div className="p-6 bg-white shadow-md rounded-md w-full max-w-4xl mx-4 sm:mx-auto">
          {/* Create Note Button */}
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-500 text-white rounded-md px-4 py-2 mb-4 w-full font-medium transition duration-200 hover:bg-blue-600"
          >
            {showForm ? 'Cancel' : 'Create Note'}
          </button>

          <h1 className="p-2 text-lg sm:text-xl font-semibold">Notes</h1>

          {/* Conditionally render form */}
          {showForm && (
            <form onSubmit={addNote} className="mb-4">
              <input
                type="text"
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Enter new note"
                required
                className="border p-2 w-full mb-2 rounded-md text-base sm:text-lg"
              />
              <button
                type="submit"
                className="bg-green-500 text-white rounded-md px-4 py-2 w-full font-medium transition duration-200 hover:bg-green-600"
              >
                Add Note
              </button>
            </form>
          )}

          {/* Notes List */}
          <ul className="grid grid-cols-1 gap-4">
            {notes.map((note) => (
              <li
                key={note.id}
                className="flex justify-between items-center border p-4 rounded-md shadow-sm bg-gray-50"
              >
                <span className="break-words">{note.content}</span>
                <button onClick={() => deleteNote(note.id)} className="hover:opacity-80 ml-4">
                  <img
                    src="delete.png"
                    alt="Delete"
                    className="w-6 h-6 sm:w-7 sm:h-7"
                  />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
