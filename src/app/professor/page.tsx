"use client";

import { useState, useEffect } from "react";
import { db } from "../../lib/firebase";
import {
  ref,
  push,
  set,
  onValue,
  update,
  get,
} from "firebase/database";
 import { useAuth } from "../../context/AuthContext";
import Nav from "@/components/Nav";

interface Assessment {
  title: string;
  rubric: { name: string; weight: number }[];
  status: string;
  moduleId: string;
}

export default function ProfessorPage() {
  const [assessments, setAssessments] = useState<Record<string, Assessment>>({});
  const [title, setTitle] = useState("");
  const [criteria, setCriteria] = useState([{ name: "Quality", weight: 100 }]);


// inside component:
const { user, loading } = useAuth();
const moduleId = "mod1"; // keep for demo
if (loading) return <p className="text-white">Loading...</p>;
if (!user) return <p className="text-white">Not logged in</p>;


  useEffect(() => {
    const aRef = ref(db, `assessments/${moduleId}`);
    return onValue(aRef, (snap) => setAssessments(snap.val() || {}));
  }, [moduleId]);

  const addCriteria = () =>
    setCriteria([...criteria, { name: "", weight: 0 }]);

  const updateCriteria = (i: number, key: string, val: string | number) =>
    setCriteria(criteria.map((c, idx) => (idx === i ? { ...c, [key]: val } : c)));

  const createAssessment = async () => {
    const total = criteria.reduce((s, c) => s + Number(c.weight), 0);
    if (total !== 100) return alert("Rubric weights must total 100");
    const aRef = push(ref(db, `assessments/${moduleId}`));
    await set(aRef, {
      title,
      rubric: criteria,
      status: "draft",
      moduleId,
      createdAt: Date.now(),
    });
    setTitle("");
    setCriteria([{ name: "Quality", weight: 100 }]);
  };

  const gradeSubmission = async (aid: string) => {
    const subsSnap = await get(ref(db, `submissions/${aid}`));
    const subs = subsSnap.val() || {};
    const studentIds = Object.keys(subs);
    if (!studentIds.length) return alert("No submissions yet");
    const sid = prompt(`Grade student (choose one):\n${studentIds.join("\n")}`);
    if (!sid) return;
    const mark = Number(prompt("Enter total mark (0-100)"));
    if (isNaN(mark)) return alert("Invalid mark");
    await set(ref(db, `submissions/${aid}/${sid}/grade`), {
      total: mark,
      status: "released",
      gradedAt: Date.now(),
    });
    alert("Grade released");
  };

  const finalizeAssessment = async (aid: string) => {
    await update(ref(db, `assessments/${moduleId}/${aid}`), {
      status: "finalized",
      finalizedAt: Date.now(),
    });
    alert("Assessment finalized");
  };

  return (

  
    <div className="p-6 text-white">
         <Nav/>
      <h1 className="text-3xl font-bold mb-6">Professor Dashboard</h1>

      {/* Create Assessment */}
      <div className="card-glass mb-6">
        <h2 className="text-xl mb-3">Create Assessment</h2>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Assessment title"
          className="w-full p-2 mb-3 text-black rounded"
        />

        {criteria.map((c, i) => (
          <div key={i} className="flex gap-2 mb-2">
            <input
              value={c.name}
              onChange={(e) => updateCriteria(i, "name", e.target.value)}
              placeholder="Criteria"
              className="flex-1 p-2 rounded text-black"
            />
            <input
              type="number"
              value={c.weight}
              onChange={(e) => updateCriteria(i, "weight", Number(e.target.value))}
              placeholder="Weight"
              className="w-24 p-2 rounded text-black"
            />
          </div>
        ))}
        <button
          onClick={addCriteria}
          className="px-3 py-1 bg-gray-200 rounded text-black mr-2"
        >
          + Add Criteria
        </button>
        <button
          onClick={createAssessment}
          className="px-4 py-1 bg-gradient-to-r from-emerald-400 to-blue-500 rounded text-white"
        >
          Create
        </button>
      </div>

      {/* List Assessments */}
      <h2 className="text-xl mb-3">Your Assessments</h2>
      <div className="space-y-3">
        {Object.entries(assessments).map(([aid, a]) => (
          <div key={aid} className="card-glass">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">{a.title}</h3>
              <span className="text-sm bg-black/30 px-2 py-1 rounded">
                {a.status}
              </span>
            </div>
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => gradeSubmission(aid)}
                className="px-3 py-1 bg-blue-500 rounded"
              >
                Grade
              </button>
              <button
                onClick={() => finalizeAssessment(aid)}
                className="px-3 py-1 bg-emerald-500 rounded"
              >
                Finalize
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
