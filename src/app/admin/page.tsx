"use client";

import { useState, useEffect } from "react";
import { ref, push, set, onValue } from "firebase/database";
import { db } from "../../lib/firebase";

interface Program {
  name: string;
}

export default function AdminPage() {
  const [programs, setPrograms] = useState<Record<string, Program>>({});
  const [name, setName] = useState("");

  useEffect(() => {
    const progRef = ref(db, "programs");
    return onValue(progRef, (snap) => setPrograms(snap.val() || {}));
  }, []);

  const createProgram = async () => {
    if (!name) return;
    const newRef = push(ref(db, "programs"));
    await set(newRef, { name });
    setName("");
  };

  return (
    <div className="p-6 text-white">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <div className="bg-white/20 p-4 rounded-xl mb-6">
        <h2 className="text-xl mb-2">Create Program</h2>
        <div className="flex gap-2">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Program name"
            className="flex-1 p-2 rounded-md text-black"
          />
          <button
            onClick={createProgram}
            className="px-4 bg-gradient-to-r from-emerald-400 to-blue-500 rounded-lg"
          >
            Add
          </button>
        </div>
      </div>

      <h2 className="text-xl mb-2">Programs</h2>
      <ul className="space-y-2">
        {Object.entries(programs).map(([id, prog]) => (
          <li
            key={id}
            className="bg-white/20 rounded-lg px-4 py-2"
          >
            {prog.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
