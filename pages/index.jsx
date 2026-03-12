import { useState, useEffect, useCallback } from "react";
import Head from "next/head";

// ─── PDF GENERATION ──────────────────────────────────────────────────────────
async function buildPDF(type, clinic, doctor, fields) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210, M = 18, CW = W - M * 2;

  const addHeader = () => {
    doc.setFillColor(15, 40, 80);
    doc.rect(0, 0, W, 36, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(17); doc.setFont("helvetica", "bold");
    doc.text(clinic.name, W / 2, 13, { align: "center" });
    doc.setFontSize(8); doc.setFont("helvetica", "normal");
    doc.text(clinic.address.replace(/\n/g, "  |  "), W / 2, 20, { align: "center" });
    doc.text(`Ph: ${clinic.phone}   Email: ${clinic.email}${clinic.reg ? "   Reg: " + clinic.reg : ""}`, W / 2, 26, { align: "center" });
    doc.setTextColor(0, 0, 0);
  };

  const addTitle = (title) => {
    doc.setFillColor(240, 244, 252);
    doc.rect(M, 42, CW, 12, "F");
    doc.setFontSize(13); doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 40, 80);
    doc.text(title, W / 2, 51, { align: "center" });
    doc.setTextColor(0, 0, 0);
  };

  const addDoctorSig = (y) => {
    doc.setFontSize(9); doc.setFont("helvetica", "normal");
    doc.text(`Place: _______________`, M, y);
    doc.text(`Date: ${new Date().toLocaleDateString("en-IN")}`, M, y + 6);
    doc.setFont("helvetica", "bold"); doc.setFontSize(10);
    doc.text(`Dr. ${doctor.name}`, W - M, y + 14, { align: "right" });
    doc.setFont("helvetica", "normal"); doc.setFontSize(9);
    doc.text(doctor.qualification, W - M, y + 20, { align: "right" });
    if (doctor.reg) doc.text(`Reg. No: ${doctor.reg}`, W - M, y + 26, { align: "right" });
    if (doctor.specialty) doc.text(doctor.specialty, W - M, y + 32, { align: "right" });
    doc.text("(Signature & Seal)", W - M, y + 38, { align: "right" });
  };

  const addFooter = () => {
    doc.setFontSize(7); doc.setFont("helvetica", "italic");
    doc.setTextColor(120, 120, 120);
    doc.text("This is a computer-generated certificate. Requires doctor's signature and official seal to be valid.", W / 2, 287, { align: "center" });
    doc.setTextColor(0, 0, 0);
  };

  const wrap = (text, x, y, maxW, lineH = 5.5) => {
    const lines = doc.splitTextToSize(text, maxW);
    doc.text(lines, x, y);
    return y + lines.length * lineH;
  };

  addHeader();
  addFooter();

  if (type === "medical") {
    addTitle("MEDICAL CERTIFICATE");
    let y = 62;
    doc.setFontSize(9); doc.setFont("helvetica", "normal");
    doc.text(`Date: ${new Date(fields.examDate).toLocaleDateString("en-IN")}`, M, y); y += 8;
    const intro = `This is to certify that I, ${doctor.name}, ${doctor.qualification}${doctor.reg ? ", Reg. No: " + doctor.reg : ""}, have examined ${fields.patientName}, ${fields.gender}, Age: ${fields.age} years, ${fields.designation || "Patient"}${fields.office ? " of " + fields.office : ""} on ${new Date(fields.examDate).toLocaleDateString("en-IN")}.`;
    y = wrap(intro, M, y, CW) + 4;
    y = wrap(`After careful examination, I hereby certify that the patient is suffering from ${fields.condition}.`, M, y, CW) + 4;
    const days = Math.round((new Date(fields.leaveTo) - new Date(fields.leaveFrom)) / 86400000) + 1;
    y = wrap(`I consider that a period of absence from duty from ${new Date(fields.leaveFrom).toLocaleDateString("en-IN")} to ${new Date(fields.leaveTo).toLocaleDateString("en-IN")} (${days} day(s)) is absolutely necessary for the restoration of health.`, M, y, CW) + 4;
    if (fields.notes) y = wrap(`Additional Recommendations: ${fields.notes}`, M, y, CW) + 4;
    addDoctorSig(y + 6);

  } else if (type === "fitness") {
    addTitle("FITNESS CERTIFICATE");
    let y = 62;
    doc.setFontSize(9); doc.setFont("helvetica", "normal");
    doc.text(`Date: ${new Date(fields.examDate).toLocaleDateString("en-IN")}`, M, y);
    doc.text(`Certificate No: FC/${Date.now()}`, W - M, y, { align: "right" }); y += 8;
    const intro = `This is to certify that I, ${doctor.name}, ${doctor.qualification}${doctor.reg ? ", Reg. No: " + doctor.reg : ""}, have carefully examined ${fields.applicantName}, ${fields.gender}, Age: ${fields.age} years, ${fields.designation || "Applicant"}${fields.office ? " of " + fields.office : ""} on ${new Date(fields.examDate).toLocaleDateString("en-IN")}.`;
    y = wrap(intro, M, y, CW) + 4;
    y = wrap(`Purpose: ${fields.purpose}`, M, y, CW) + 4;
    if (fields.history) y = wrap(`Previous Medical History: ${fields.history}`, M, y, CW) + 4;
    doc.setFont("helvetica", "bold");
    doc.text("CERTIFICATION:", M, y); y += 6;
    doc.setFont("helvetica", "normal");
    y = wrap(fields.remarks, M, y, CW) + 4;
    doc.setFont("helvetica", "bold");
    y = wrap("The applicant is MEDICALLY FIT for the above-mentioned purpose.", M, y, CW) + 4;
    doc.setFont("helvetica", "normal");
    addDoctorSig(y + 6);

  } else if (type === "sickleave") {
    addTitle("SICK LEAVE CERTIFICATE");
    let y = 62;
    doc.setFontSize(9); doc.setFont("helvetica", "normal");
    doc.text(`Date: ${new Date(fields.examDate).toLocaleDateString("en-IN")}`, M, y); y += 8;
    doc.text("To,", M, y); y += 5;
    doc.text("The HR Manager / Concerned Authority", M, y); y += 5;
    doc.text(fields.company, M, y); y += 8;
    doc.setFont("helvetica", "bold");
    doc.text("Subject: Medical Certificate for Sick Leave", M, y);
    doc.setFont("helvetica", "normal"); y += 8;
    doc.text("Dear Sir/Madam,", M, y); y += 6;
    y = wrap(`This is to certify that ${fields.empName}${fields.empId ? ", Employee ID: " + fields.empId : ""}${fields.dept ? ", " + fields.dept : ""} has been under my medical care.`, M, y, CW) + 4;
    y = wrap(`After thorough examination on ${new Date(fields.examDate).toLocaleDateString("en-IN")}, I have diagnosed the patient with ${fields.illness}.`, M, y, CW) + 4;
    const days = Math.round((new Date(fields.leaveTo) - new Date(fields.leaveFrom)) / 86400000) + 1;
    y = wrap(`Due to this medical condition, I recommend sick leave from ${new Date(fields.leaveFrom).toLocaleDateString("en-IN")} to ${new Date(fields.leaveTo).toLocaleDateString("en-IN")} (${days} day(s)).`, M, y, CW) + 4;
    if (fields.bedRest) y = wrap("Complete bed rest and avoiding strenuous activities is advised during this period.", M, y, CW) + 4;
    if (fields.followUp) y = wrap(`Follow-up consultation is scheduled for: ${fields.followUp}`, M, y, CW) + 4;
    y = wrap("I request you to kindly grant the necessary leave for the recovery and restoration of health.", M, y, CW) + 4;
    doc.text("Thanking you,", M, y + 4);
    doc.setFont("helvetica", "bold"); doc.setFontSize(10);
    doc.text(`Dr. ${doctor.name}`, M, y + 16);
    doc.setFont("helvetica", "normal"); doc.setFontSize(9);
    doc.text(doctor.qualification, M, y + 22);
    if (doctor.reg) doc.text(`Reg. No: ${doctor.reg}`, M, y + 28);
    if (doctor.specialty) doc.text(doctor.specialty, M, y + 34);

  } else if (type === "form1a") {
    addTitle("FORM 1A — Medical Certificate for Driving License");
    let y = 62;
    doc.setFontSize(9); doc.setFont("helvetica", "normal");
    doc.text(`Date of Examination: ${new Date(fields.examDate).toLocaleDateString("en-IN")}`, M, y); y += 8;
    doc.setFont("helvetica", "bold"); doc.text("APPLICANT DETAILS:", M, y); doc.setFont("helvetica", "normal"); y += 6;
    doc.text(`Name: ${fields.applicantName}   |   Age: ${fields.age} yrs   |   Gender: ${fields.gender}`, M, y); y += 5;
    y = wrap(`Address: ${fields.address}`, M, y, CW) + 3;
    doc.text(`License Type Applied: ${fields.licenseType}`, M, y); y += 8;
    doc.setFont("helvetica", "bold"); doc.text("MEDICAL EXAMINATION:", M, y); doc.setFont("helvetica", "normal"); y += 6;
    doc.text(`Height: ${fields.height} cm   |   Weight: ${fields.weight} kg`, M, y); y += 5;
    doc.text(`Vision — Right Eye: ${fields.visionR}   |   Left Eye: ${fields.visionL}   |   Color Blind: ${fields.colorBlind ? "Yes" : "No"}`, M, y); y += 5;
    doc.text(`Hearing: ${fields.hearing ? "Normal" : "Impaired"}   |   Physical Deformity: ${fields.deformity || "None"}`, M, y); y += 8;
    doc.setFont("helvetica", "bold"); doc.text("CERTIFICATION:", M, y); doc.setFont("helvetica", "normal"); y += 6;
    const verdict = fields.fit
      ? `I, ${doctor.name}, ${doctor.qualification}${doctor.reg ? ", Reg. No: " + doctor.reg : ""}, hereby certify that I have personally examined the above-named applicant and find him/her MEDICALLY FIT to drive a ${fields.licenseType}.`
      : `I, ${doctor.name}, ${doctor.qualification}${doctor.reg ? ", Reg. No: " + doctor.reg : ""}, hereby certify that I have personally examined the above-named applicant and find him/her NOT FIT to drive at this time due to medical reasons.`;
    y = wrap(verdict, M, y, CW) + 4;
    y = wrap("The applicant has been examined for any physical or mental disability that may interfere with safe driving.", M, y, CW) + 4;
    addDoctorSig(y + 6);
  }

  return doc;
}

// ─── TODAY DATE STRING ────────────────────────────────────────────────────────
const today = () => new Date().toISOString().split("T")[0];

// ─── SHARE: encode state to URL ───────────────────────────────────────────────
function encodeShare(state) {
  try { return btoa(encodeURIComponent(JSON.stringify(state))); } catch { return ""; }
}
function decodeShare(str) {
  try { return JSON.parse(decodeURIComponent(atob(str))); } catch { return null; }
}

// ─── COMPONENTS ───────────────────────────────────────────────────────────────
const Input = ({ label, req, ...p }) => (
  <label style={s.label}>
    <span style={s.labelTxt}>{label}{req && <span style={{ color: "#e53e3e" }}> *</span>}</span>
    <input style={s.input} {...p} />
  </label>
);
const Textarea = ({ label, req, ...p }) => (
  <label style={s.label}>
    <span style={s.labelTxt}>{label}{req && <span style={{ color: "#e53e3e" }}> *</span>}</span>
    <textarea style={{ ...s.input, height: 72, resize: "vertical" }} {...p} />
  </label>
);
const Select = ({ label, options, ...p }) => (
  <label style={s.label}>
    <span style={s.labelTxt}>{label}</span>
    <select style={s.input} {...p}>
      {options.map(o => <option key={o}>{o}</option>)}
    </select>
  </label>
);
const Checkbox = ({ label, ...p }) => (
  <label style={{ display: "flex", gap: 8, alignItems: "center", cursor: "pointer", fontSize: 13, color: "#2d3748" }}>
    <input type="checkbox" style={{ accentColor: "#0f2850", width: 15, height: 15 }} {...p} />
    {label}
  </label>
);
const Row = ({ children }) => <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>{children}</div>;
const Section = ({ title, children }) => (
  <div style={{ marginBottom: 20 }}>
    <p style={{ fontWeight: 700, fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: "#0f2850", borderBottom: "2px solid #e2e8f0", paddingBottom: 6, marginBottom: 12 }}>{title}</p>
    {children}
  </div>
);

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [activeTab, setActiveTab] = useState(0);
  const [status, setStatus] = useState("");
  const [copied, setCopied] = useState(false);

  const [clinic, setClinic] = useState({ name: "City Medical Clinic", address: "123 Medical Street, Mumbai - 400001", phone: "+91 98765 43210", email: "clinic@medcert.in", reg: "REG/2024/12345" });
  const [doctor, setDoctor] = useState({ name: "", qualification: "MBBS, MD", reg: "MCI12345", specialty: "General Physician" });

  const [mc, setMc] = useState({ patientName: "", age: 25, gender: "Male", designation: "", office: "", examDate: today(), condition: "", leaveFrom: today(), leaveTo: today(), notes: "" });
  const [fc, setFc] = useState({ applicantName: "", age: 25, gender: "Male", designation: "", office: "", examDate: today(), purpose: "", history: "", remarks: "Patient has been thoroughly examined and found to be in good health." });
  const [sl, setSl] = useState({ empName: "", empId: "", dept: "", company: "", examDate: today(), illness: "", leaveFrom: today(), leaveTo: today(), bedRest: true, followUp: "" });
  const [f1, setF1] = useState({ applicantName: "", age: 25, gender: "Male", address: "", licenseType: "LMV (Light Motor Vehicle)", examDate: today(), height: "", weight: "", visionR: "6/6", visionL: "6/6", colorBlind: false, hearing: true, deformity: "", fit: true });

  // Restore from URL share param
  useEffect(() => {
    if (typeof window === "undefined") return;
    const p = new URLSearchParams(window.location.search).get("d");
    if (!p) return;
    const d = decodeShare(p);
    if (!d) return;
    if (d.clinic) setClinic(d.clinic);
    if (d.doctor) setDoctor(d.doctor);
    if (d.mc) setMc(d.mc);
    if (d.fc) setFc(d.fc);
    if (d.sl) setSl(d.sl);
    if (d.f1) setF1(d.f1);
    if (d.tab != null) setActiveTab(d.tab);
  }, []);

  const upd = (setter) => (field) => (e) => setter(prev => ({ ...prev, [field]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));
  const updC = upd(setClinic); const updD = upd(setDoctor);
  const updMc = upd(setMc); const updFc = upd(setFc); const updSl = upd(setSl); const updF1 = upd(setF1);

  const handleGenerate = async (type) => {
    if (!doctor.name) { setStatus("⚠️ Please enter Doctor Name in the sidebar."); return; }
    setStatus("⏳ Generating PDF…");
    try {
      const fieldMap = { medical: mc, fitness: fc, sickleave: sl, form1a: f1 };
      const doc = await buildPDF(type, clinic, doctor, fieldMap[type]);
      const names = { medical: `Medical_Cert_${mc.patientName || "Patient"}`, fitness: `Fitness_Cert_${fc.applicantName || "Applicant"}`, sickleave: `SickLeave_${sl.empName || "Employee"}`, form1a: `Form1A_${f1.applicantName || "Applicant"}` };
      doc.save(`${names[type].replace(/\s+/g, "_")}_${Date.now()}.pdf`);
      setStatus("✅ Certificate downloaded!");
    } catch (err) {
      setStatus("❌ Error: " + err.message);
    }
  };

  const handleShare = () => {
    const data = { clinic, doctor, mc, fc, sl, f1, tab: activeTab };
    const encoded = encodeShare(data);
    const url = `${window.location.origin}${window.location.pathname}?d=${encoded}`;
    navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500); });
  };

  const tabs = ["📋 Medical", "💪 Fitness", "🏃 Sick Leave", "📄 Form 1A"];
  const certTypes = ["medical", "fitness", "sickleave", "form1a"];

  return (
    <>
      <Head>
        <title>Medical Certificate Generator</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Lora:wght@600;700&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
      </Head>

      <div style={s.page}>
        {/* NAV */}
        <header style={s.nav}>
          <div style={s.navInner}>
            <span style={s.navLogo}>🏥 MedCert</span>
            <button onClick={handleShare} style={s.shareBtn}>
              {copied ? "✓ Link Copied!" : "⬆ Share Form"}
            </button>
          </div>
        </header>

        <div style={s.hero}>
          <h1 style={s.heroTitle}>Medical Certificate Generator</h1>
          <p style={s.heroSub}>Professional certificates — generate, save & share instantly</p>
        </div>

        <div style={s.layout}>
          {/* SIDEBAR */}
          <aside style={s.sidebar}>
            <Section title="Clinic Info">
              <Input label="Clinic Name" value={clinic.name} onChange={updC("name")} />
              <Textarea label="Address" value={clinic.address} onChange={updC("address")} />
              <Input label="Phone" value={clinic.phone} onChange={updC("phone")} />
              <Input label="Email" type="email" value={clinic.email} onChange={updC("email")} />
              <Input label="Reg. No." value={clinic.reg} onChange={updC("reg")} />
            </Section>
            <Section title="Doctor Details">
              <Input label="Doctor Name" req value={doctor.name} onChange={updD("name")} placeholder="Full name without Dr." />
              <Input label="Qualification" req value={doctor.qualification} onChange={updD("qualification")} />
              <Input label="Medical Reg. No." value={doctor.reg} onChange={updD("reg")} />
              <Input label="Specialization" value={doctor.specialty} onChange={updD("specialty")} />
            </Section>
          </aside>

          {/* MAIN */}
          <main style={s.main}>
            {/* TABS */}
            <div style={s.tabBar}>
              {tabs.map((t, i) => (
                <button key={i} onClick={() => setActiveTab(i)} style={{ ...s.tab, ...(activeTab === i ? s.tabActive : {}) }}>{t}</button>
              ))}
            </div>

            <div style={s.card}>
              {/* MEDICAL */}
              {activeTab === 0 && (
                <>
                  <Section title="Patient Information">
                    <Row><Input label="Patient Name" req value={mc.patientName} onChange={updMc("patientName")} /><Input label="Age" type="number" value={mc.age} onChange={updMc("age")} /></Row>
                    <Row><Select label="Gender" options={["Male", "Female", "Other"]} value={mc.gender} onChange={updMc("gender")} /><Input label="Designation / Occupation" value={mc.designation} onChange={updMc("designation")} /></Row>
                    <Input label="Office / Organization" value={mc.office} onChange={updMc("office")} />
                  </Section>
                  <Section title="Medical Details">
                    <Input label="Date of Examination" type="date" value={mc.examDate} onChange={updMc("examDate")} />
                    <Textarea label="Medical Condition / Diagnosis" req value={mc.condition} onChange={updMc("condition")} placeholder="E.g., Viral Fever, Acute Gastroenteritis" />
                    <Row>
                      <Input label="Leave From" type="date" value={mc.leaveFrom} onChange={updMc("leaveFrom")} />
                      <Input label="Leave To" type="date" value={mc.leaveTo} onChange={updMc("leaveTo")} />
                    </Row>
                    <Textarea label="Additional Recommendations" value={mc.notes} onChange={updMc("notes")} placeholder="E.g., Complete bed rest advised" />
                  </Section>
                </>
              )}

              {/* FITNESS */}
              {activeTab === 1 && (
                <>
                  <Section title="Applicant Information">
                    <Row><Input label="Applicant Name" req value={fc.applicantName} onChange={updFc("applicantName")} /><Input label="Age" type="number" value={fc.age} onChange={updFc("age")} /></Row>
                    <Row><Select label="Gender" options={["Male", "Female", "Other"]} value={fc.gender} onChange={updFc("gender")} /><Input label="Designation" value={fc.designation} onChange={updFc("designation")} /></Row>
                    <Input label="Office / Organization" value={fc.office} onChange={updFc("office")} />
                  </Section>
                  <Section title="Fitness Details">
                    <Input label="Date of Examination" type="date" value={fc.examDate} onChange={updFc("examDate")} />
                    <Input label="Purpose of Certificate" req value={fc.purpose} onChange={updFc("purpose")} placeholder="E.g., Employment, Sports, Visa" />
                    <Textarea label="Previous Medical History" value={fc.history} onChange={updFc("history")} placeholder="E.g., No significant illness" />
                    <Textarea label="Certification Remarks" req value={fc.remarks} onChange={updFc("remarks")} />
                  </Section>
                </>
              )}

              {/* SICK LEAVE */}
              {activeTab === 2 && (
                <>
                  <Section title="Employee Information">
                    <Row><Input label="Employee Name" req value={sl.empName} onChange={updSl("empName")} /><Input label="Employee ID" value={sl.empId} onChange={updSl("empId")} /></Row>
                    <Row><Input label="Department" value={sl.dept} onChange={updSl("dept")} /><Input label="Company / Organization" value={sl.company} onChange={updSl("company")} /></Row>
                  </Section>
                  <Section title="Leave Details">
                    <Input label="Date of Examination" type="date" value={sl.examDate} onChange={updSl("examDate")} />
                    <Textarea label="Illness / Diagnosis" req value={sl.illness} onChange={updSl("illness")} placeholder="E.g., Acute Respiratory Tract Infection" />
                    <Row>
                      <Input label="Leave From" type="date" value={sl.leaveFrom} onChange={updSl("leaveFrom")} />
                      <Input label="Leave To" type="date" value={sl.leaveTo} onChange={updSl("leaveTo")} />
                    </Row>
                    <Checkbox label="Bed rest advised" checked={sl.bedRest} onChange={updSl("bedRest")} />
                    <div style={{ marginTop: 10 }}><Input label="Follow-up Date (optional)" type="date" value={sl.followUp} onChange={updSl("followUp")} /></div>
                  </Section>
                </>
              )}

              {/* FORM 1A */}
              {activeTab === 3 && (
                <>
                  <Section title="Applicant Details">
                    <Row><Input label="Full Name" req value={f1.applicantName} onChange={updF1("applicantName")} /><Input label="Age" type="number" value={f1.age} onChange={updF1("age")} /></Row>
                    <Row><Select label="Gender" options={["Male", "Female", "Other"]} value={f1.gender} onChange={updF1("gender")} /><Select label="License Type" options={["LMV (Light Motor Vehicle)", "MCWG (Motorcycle with Gear)", "HMV (Heavy Motor Vehicle)", "Transport Vehicle"]} value={f1.licenseType} onChange={updF1("licenseType")} /></Row>
                    <Textarea label="Address" req value={f1.address} onChange={updF1("address")} />
                    <Input label="Date of Examination" type="date" value={f1.examDate} onChange={updF1("examDate")} />
                  </Section>
                  <Section title="Medical Examination">
                    <Row><Input label="Height (cm)" value={f1.height} onChange={updF1("height")} /><Input label="Weight (kg)" value={f1.weight} onChange={updF1("weight")} /></Row>
                    <Row><Input label="Vision — Right Eye" value={f1.visionR} onChange={updF1("visionR")} placeholder="6/6" /><Input label="Vision — Left Eye" value={f1.visionL} onChange={updF1("visionL")} placeholder="6/6" /></Row>
                    <Row>
                      <Checkbox label="Color Blind" checked={f1.colorBlind} onChange={updF1("colorBlind")} />
                      <Checkbox label="Hearing Normal" checked={f1.hearing} onChange={updF1("hearing")} />
                    </Row>
                    <div style={{ marginTop: 10 }}><Input label="Physical Deformity (if any)" value={f1.deformity} onChange={updF1("deformity")} placeholder="None" /></div>
                    <div style={{ marginTop: 8 }}><Checkbox label="Applicant is FIT to drive" checked={f1.fit} onChange={updF1("fit")} /></div>
                  </Section>
                </>
              )}

              {/* ACTIONS */}
              {status && (
                <div style={{ ...s.statusBar, background: status.startsWith("✅") ? "#f0fff4" : status.startsWith("❌") ? "#fff5f5" : "#fffbea", borderColor: status.startsWith("✅") ? "#9ae6b4" : status.startsWith("❌") ? "#fed7d7" : "#fbd38d", color: status.startsWith("✅") ? "#276749" : status.startsWith("❌") ? "#9b2c2c" : "#7b5c0e" }}>
                  {status}
                </div>
              )}

              <div style={s.actionRow}>
                <button onClick={() => handleGenerate(certTypes[activeTab])} style={s.generateBtn}>
                  ⬇ Generate & Save PDF
                </button>
                <button onClick={handleShare} style={s.shareBtn2}>
                  {copied ? "✓ Copied!" : "⬆ Copy Share Link"}
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const s = {
  page: { minHeight: "100vh", background: "#f7f9fc", fontFamily: "'DM Sans', sans-serif", color: "#1a202c" },
  nav: { background: "#0f2850", padding: "0 24px", height: 56, display: "flex", alignItems: "center", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 2px 12px rgba(15,40,80,.3)" },
  navInner: { maxWidth: 1200, margin: "0 auto", width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center" },
  navLogo: { fontFamily: "'Lora', serif", color: "#fff", fontWeight: 700, fontSize: 20, letterSpacing: "-0.02em" },
  hero: { background: "linear-gradient(120deg,#0f2850 0%,#1a4a8a 100%)", padding: "40px 24px 36px", textAlign: "center" },
  heroTitle: { fontFamily: "'Lora', serif", color: "#fff", fontSize: 30, fontWeight: 700, margin: 0, letterSpacing: "-0.03em" },
  heroSub: { color: "#93b4d8", marginTop: 8, fontSize: 15 },
  layout: { display: "grid", gridTemplateColumns: "280px 1fr", gap: 24, maxWidth: 1200, margin: "0 auto", padding: "24px 16px" },
  sidebar: { background: "#fff", borderRadius: 12, padding: 20, height: "fit-content", boxShadow: "0 1px 4px rgba(0,0,0,.08)", border: "1px solid #e2e8f0", position: "sticky", top: 72 },
  main: {},
  tabBar: { display: "flex", gap: 4, marginBottom: 16, background: "#e8edf5", borderRadius: 10, padding: 4 },
  tab: { flex: 1, padding: "8px 4px", background: "transparent", border: "none", cursor: "pointer", borderRadius: 7, fontSize: 12.5, fontWeight: 500, color: "#4a5568", fontFamily: "'DM Sans', sans-serif", transition: "all .2s" },
  tabActive: { background: "#fff", color: "#0f2850", fontWeight: 700, boxShadow: "0 1px 4px rgba(0,0,0,.12)" },
  card: { background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,.08)", border: "1px solid #e2e8f0" },
  label: { display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 },
  labelTxt: { fontSize: 12, fontWeight: 600, color: "#4a5568", letterSpacing: "0.02em" },
  input: { padding: "8px 10px", border: "1.5px solid #e2e8f0", borderRadius: 7, fontSize: 13, fontFamily: "'DM Sans', sans-serif", color: "#2d3748", background: "#fafbfc", outline: "none", transition: "border .15s", width: "100%", boxSizing: "border-box" },
  statusBar: { padding: "10px 14px", borderRadius: 7, border: "1.5px solid", fontSize: 13, fontWeight: 500, marginBottom: 14 },
  actionRow: { display: "flex", gap: 10, marginTop: 8 },
  generateBtn: { flex: 2, padding: "13px 20px", background: "linear-gradient(135deg,#0f2850,#1a4a8a)", color: "#fff", border: "none", borderRadius: 9, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", letterSpacing: "-0.01em", boxShadow: "0 3px 10px rgba(15,40,80,.3)" },
  shareBtn: { padding: "7px 16px", background: "transparent", color: "#93b4d8", border: "1.5px solid #2a5090", borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" },
  shareBtn2: { flex: 1, padding: "13px 16px", background: "#f0f4fb", color: "#0f2850", border: "1.5px solid #c8d8f0", borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" },
};
