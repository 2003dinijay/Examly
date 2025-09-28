"use client";

import { useState, useEffect } from "react";
import { db, storage } from "../../lib/firebase";
import { ref, onValue, set, push, get } from "firebase/database";
import {
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import jsPDF from "jspdf";

import { useAuth } from "../../context/AuthContext";
import Nav from "@/components/Nav";
// import QRCode from "qrcode";



interface Assessment {
  title: string;
  status: string;
}

export default function StudentPage() {
  const [assessments, setAssessments] = useState<Record<string, Assessment>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

 const { user, loading } = useAuth();
if (loading) return <p className="text-white">Loading...</p>;
if (!user) return <p className="text-white">Not logged in</p>;
const uid = user.uid;

  const moduleId = "mod1"; // demo module

  useEffect(() => {
    const aRef = ref(db, `assessments/${moduleId}`);
    return onValue(aRef, (snap) => setAssessments(snap.val() || {}));
  }, []);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selected) return alert("Select an assessment first");
    const file = e.target.files?.[0];
    if (!file) return;
    const sRef = storageRef(storage, `submissions/${selected}/${uid}_${file.name}`);
    const task = uploadBytesResumable(sRef, file);
    setUploading(true);

    task.on(
      "state_changed",
      (snap) => {
        const prog = (snap.bytesTransferred / snap.totalBytes) * 100;
        setProgress(Math.round(prog));
      },
      (err) => {
        console.error(err);
        setUploading(false);
      },
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        await set(ref(db, `submissions/${selected}/${uid}`), {
          fileUrl: url,
          fileName: file.name,
          timestamp: Date.now(),
        });
        setUploading(false);
        setProgress(0);
        alert("Submission uploaded!");
      }
    );
  };

  const downloadTranscript = async () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Transcript", 20, 20);
    doc.setFontSize(12);
    doc.text(`Student: ${uid}`, 20, 30);

    let y = 40;
    const aSnap = await get(ref(db, `assessments/${moduleId}`));
    const assessmentsData = aSnap.val() || {};

    for (const [aid, a] of Object.entries(assessmentsData)) {
      const gSnap = await get(ref(db, `submissions/${aid}/${uid}/grade`));
      const grade = gSnap.val();
      doc.text(`${(a as Assessment).title}: ${grade ? grade.total : "Pending"}`, 20, y);
      y += 8;
    }

    // const qr = await QRCode.toDataURL(`EGS|student:${uid}|${Date.now()}`);
    // doc.addImage(qr, "PNG", 140, 10, 50, 50);

    doc.save(`transcript_${uid}.pdf`);
  };

  return (
    <div className="p-6 text-white">
        <Nav/>
      <h1 className="text-3xl font-bold mb-6">Student Dashboard</h1>

      {/* List Assessments */}
      <h2 className="text-xl mb-3">Assessments</h2>
      <div className="space-y-2">
        {Object.entries(assessments).map(([aid, a]) => (
          <div
            key={aid}
            className={`card-glass cursor-pointer ${
              selected === aid ? "ring-2 ring-emerald-400" : ""
            }`}
            onClick={() => setSelected(aid)}
          >
            <strong>{a.title}</strong> —{" "}
            <span className="text-sm">{a.status}</span>
          </div>
        ))}
      </div>

      {/* File Upload */}
      <div className="card-glass mt-6">
        <h3 className="text-lg mb-2">Submit Work</h3>
        <input type="file" onChange={handleUpload} className="text-black" />
        {uploading && <p>Uploading... {progress}%</p>}
      </div>

      {/* Transcript */}
      <div className="card-glass mt-6">
        <h3 className="text-lg mb-2">Transcript</h3>
        <button
          onClick={downloadTranscript}
          className="px-4 py-2 bg-gradient-to-r from-emerald-400 to-blue-500 rounded-lg"
        >
          Download PDF
        </button>
      </div>
    </div>
  );
}
