// @ts-nocheck
import { useState, useEffect, useCallback, useRef } from "react";

const SUPABASE_URL = "https://zgamhginvurxausvvswi.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnYW1oZ2ludnVyeGF1c3Z2c3dpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMzQxNzYsImV4cCI6MjA5NDgxMDE3Nn0.4xEWvp7aMU8olVFX_E7dG01_YC_ty5AdJyLLr9vzGxE";

const TOTAL_WEEKS = 12;

async function sbDelete(sessionKey, exerciseId, setNum) {
  await fetch(
    `${SUPABASE_URL}/rest/v1/workout_sets?session_key=eq.${sessionKey}&exercise_id=eq.${exerciseId}&set_num=eq.${setNum}`,
    { method: "DELETE", headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
  );
}

async function sbInsert(row) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/workout_sets`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    body: JSON.stringify(row),
  });
  return res.ok;
}

async function sbSave(row) {
  await sbDelete(row.session_key, row.exercise_id, row.set_num);
  return sbInsert(row);
}

async function sbLoadAll() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/workout_sets?select=*`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
  });
  if (!res.ok) return [];
  return res.json();
}

// ─── WORKOUT DEFINITIONS ───
const WORKOUTS = [
  {
    id: "upper_a", name: "Upper A", subtitle: "Chest + Back", day: 1,
    exercises: [
      { id: "db_bench", name: "Dumbbell Bench Press", sets: 4, reps: "8–10", alt: "Push-Up (weighted or feet elevated)" },
      { id: "cable_row", name: "Cable or Machine Row", sets: 4, reps: "10–12", alt: "Dumbbell Bent-Over Row" },
      { id: "incline_db", name: "Incline Dumbbell Press", sets: 3, reps: "10–12", alt: "Dumbbell Floor Press" },
      { id: "lat_pull", name: "Lat Pulldown", sets: 3, reps: "10–12", alt: "Dumbbell Pullover" },
      { id: "db_lat_raise_a", name: "Dumbbell Lateral Raise", sets: 3, reps: "15", alt: "Machine Lateral Raise" },
      { id: "face_pull", name: "Cable Face Pull", sets: 3, reps: "15", alt: "Dumbbell Rear Delt Fly" },
    ],
  },
  {
    id: "lower_a", name: "Lower A", subtitle: "Quad Emphasis", day: 2,
    exercises: [
      { id: "goblet_squat", name: "Goblet Squat or Leg Press", sets: 4, reps: "10–12", alt: "Dumbbell Sumo Squat" },
      { id: "leg_ext", name: "Leg Extension", sets: 3, reps: "12–15", alt: "Dumbbell Wall Sit (hold)" },
      { id: "leg_curl_a", name: "Leg Curl", sets: 4, reps: "12–15", alt: "DB Hamstring Curl (lying)" },
      { id: "calf_raise_a", name: "Standing Calf Raise", sets: 4, reps: "15–20", alt: "Seated Calf Raise" },
      { id: "plank", name: "Plank", sets: 3, reps: "30–45s", alt: "Dead Bug" },
    ],
  },
  {
    id: "upper_b", name: "Upper B", subtitle: "Shoulder + Arms", day: 4,
    exercises: [
      { id: "db_ohp", name: "Dumbbell Shoulder Press", sets: 4, reps: "8–10", alt: "Machine Shoulder Press" },
      { id: "cable_row_b", name: "Cable or Machine Row", sets: 3, reps: "10–12", alt: "Dumbbell Bent-Over Row" },
      { id: "incline_curl", name: "Dumbbell Incline Curl", sets: 3, reps: "10–12", alt: "Standing Dumbbell Curl" },
      { id: "tri_rope", name: "Tricep Rope Pulldown", sets: 3, reps: "12–15", alt: "DB Overhead Tricep Extension" },
      { id: "machine_lat_raise", name: "Machine Lateral Raise", sets: 3, reps: "15", alt: "Dumbbell Lateral Raise" },
      { id: "rear_delt_fly", name: "Rear Delt Machine Fly", sets: 3, reps: "15", alt: "Dumbbell Rear Delt Fly" },
    ],
  },
  {
    id: "lower_b", name: "Lower B", subtitle: "Hamstring + Glute", day: 5,
    exercises: [
      { id: "bss", name: "Bulgarian Split Squat", sets: 4, reps: "10 each", alt: "Dumbbell Reverse Lunge" },
      { id: "leg_press", name: "Leg Press", sets: 3, reps: "12–15", alt: "Goblet Squat" },
      { id: "leg_curl_b", name: "Leg Curl", sets: 4, reps: "12–15", alt: "DB Hamstring Curl (lying)" },
      { id: "calf_raise_b", name: "Standing Calf Raise", sets: 3, reps: "15–20", alt: "Step Calf Raise" },
      { id: "ab_wheel", name: "Ab Wheel or Hanging Knee Raise", sets: 3, reps: "10–15", alt: "Plank" },
    ],
  },
  {
    id: "conditioning", name: "Conditioning", subtitle: "20–30 min", day: 6,
    exercises: [
      { id: "cardio", name: "Incline walk / Row / Bike / Stairs", sets: 1, reps: "20–30 min", alt: "Any low-impact steady-state cardio" },
    ],
  },
];

const DAY_LABELS = ["Upper A", "Lower A", "Rest", "Upper B", "Lower B", "Conditioning", "Rest"];

// ─── LIGHT THEME ───
const font = "-apple-system, 'SF Pro Display', 'SF Pro Text', system-ui, sans-serif";
const C = {
  bg: "#f7f7f5",
  card: "#ffffff",
  border: "#e8e5e0",
  text: "#1a1a1a",
  textDim: "#9a9590",
  textMid: "#6b6560",
  accent: "#2563eb",
  accentLight: "#dbeafe",
  accentMid: "#93c5fd",
  done: "#16a34a",
  doneLight: "#dcfce7",
  warn: "#d97706",
  danger: "#dc2626",
  headerBg: "rgba(247,247,245,0.92)",
};

export default function App() {
  const [data, setData] = useState({});
  const [week, setWeek] = useState(1);
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [syncStatus, setSyncStatus] = useState("ok");
  const [showAlts, setShowAlts] = useState({});
  const [loaded, setLoaded] = useState(false);
  const saveQueue = useRef([]);
  const processing = useRef(false);

  useEffect(() => { document.body.style.background = C.bg; document.querySelector('meta[name="theme-color"]')?.setAttribute("content", C.bg); }, []);

  useEffect(() => {
    (async () => {
      try {
        const rows = await sbLoadAll();
        const map = {};
        rows.forEach((r) => {
          const k = `${r.session_key}_${r.exercise_id}_s${r.set_num}`;
          map[k] = { weight: r.weight || "", done: r.done || false };
        });
        setData(map);
      } catch { setSyncStatus("error"); }
      setLoaded(true);
    })();
  }, []);

  const processQueue = useCallback(async () => {
    if (processing.current) return;
    processing.current = true;
    while (saveQueue.current.length > 0) {
      const job = saveQueue.current.shift();
      setSyncStatus("saving");
      try { const ok = await sbSave(job); if (!ok) setSyncStatus("error"); }
      catch { setSyncStatus("error"); }
    }
    setSyncStatus("ok");
    processing.current = false;
  }, []);

  const updateSet = useCallback((sessionKey, exerciseId, setNum, field, value) => {
    const key = `${sessionKey}_${exerciseId}_s${setNum}`;
    setData((prev) => {
      const cur = prev[key] || { weight: "", done: false };
      const updated = { ...cur, [field]: value };
      saveQueue.current.push({ session_key: sessionKey, exercise_id: exerciseId, set_num: setNum, weight: updated.weight, done: updated.done });
      processQueue();
      return { ...prev, [key]: updated };
    });
  }, [processQueue]);

  const toggleAlt = (exId) => setShowAlts((p) => ({ ...p, [exId]: !p[exId] }));

  const getWeekProgress = (w) => {
    let total = 0, done = 0;
    WORKOUTS.forEach((wo) => { wo.exercises.forEach((ex) => { for (let s = 1; s <= ex.sets; s++) { total++; if (data[`W${w}D${wo.day}_${ex.id}_s${s}`]?.done) done++; } }); });
    return total === 0 ? 0 : done / total;
  };
  const getWorkoutProgress = (wo, w) => {
    let total = 0, done = 0;
    wo.exercises.forEach((ex) => { for (let s = 1; s <= ex.sets; s++) { total++; if (data[`W${w}D${wo.day}_${ex.id}_s${s}`]?.done) done++; } });
    return total === 0 ? 0 : done / total;
  };
  const getTotalProgress = () => {
    let total = 0, done = 0;
    for (let w = 1; w <= TOTAL_WEEKS; w++) { WORKOUTS.forEach((wo) => { wo.exercises.forEach((ex) => { for (let s = 1; s <= ex.sets; s++) { total++; if (data[`W${w}D${wo.day}_${ex.id}_s${s}`]?.done) done++; } }); }); }
    return total === 0 ? 0 : done / total;
  };

  const syncDot = syncStatus === "ok" ? C.done : syncStatus === "saving" ? C.warn : C.danger;

  if (!loaded) return (
    <div style={{ background: C.bg, color: C.text, height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: font, fontSize: 15 }}>
      Loading...
    </div>
  );

  // ─── WORKOUT DETAIL VIEW ───
  if (activeWorkout) {
    const wo = activeWorkout;
    const sessionKey = `W${week}D${wo.day}`;
    const prog = getWorkoutProgress(wo, week);

    return (
      <div style={{ background: C.bg, minHeight: "100vh", fontFamily: font, color: C.text, paddingBottom: 80 }}>
        {/* Sticky header */}
        <div style={{ padding: "16px 20px 14px", position: "sticky", top: 0, background: C.headerBg, backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", zIndex: 10, borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <button onClick={() => setActiveWorkout(null)} style={{ background: "none", border: "none", color: C.accent, fontFamily: font, fontSize: 15, fontWeight: 500, cursor: "pointer", padding: 0 }}>
              ← Back
            </button>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: syncDot }} />
          </div>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: -0.3 }}>{wo.name}</h2>
              <div style={{ fontSize: 13, color: C.textDim, marginTop: 2 }}>Week {week} · {wo.subtitle}</div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: prog === 1 ? C.done : C.textMid }}>
              {Math.round(prog * 100)}%
            </div>
          </div>
          <div style={{ height: 3, background: C.border, borderRadius: 2, marginTop: 12 }}>
            <div style={{ height: "100%", width: `${prog * 100}%`, background: prog === 1 ? C.done : C.accent, borderRadius: 2, transition: "width 0.3s" }} />
          </div>
        </div>

        {/* Exercise list */}
        <div style={{ padding: "12px 20px" }}>
          {wo.exercises.map((ex, exIdx) => {
            const allDone = Array.from({ length: ex.sets }, (_, i) => {
              const k = `${sessionKey}_${ex.id}_s${i + 1}`;
              return data[k]?.done;
            }).every(Boolean);

            return (
              <div key={ex.id} style={{ marginBottom: 20 }}>
                {/* Exercise header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
                    <div style={{
                      width: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: 600,
                      background: allDone ? C.doneLight : C.accentLight,
                      color: allDone ? C.done : C.accent,
                    }}>
                      {allDone ? "✓" : exIdx + 1}
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.25 }}>{ex.name}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
                        <span style={{ fontSize: 12, color: C.textDim }}>{ex.sets} × {ex.reps}</span>
                        <button onClick={() => toggleAlt(ex.id)} style={{ background: "none", border: "none", color: C.accent, fontFamily: font, fontSize: 12, cursor: "pointer", padding: 0, fontWeight: 500 }}>
                          {showAlts[ex.id] ? "Hide alt" : "Alt?"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {showAlts[ex.id] && (
                  <div style={{ fontSize: 13, color: C.accent, background: C.accentLight, padding: "8px 12px", borderRadius: 8, marginBottom: 12, marginLeft: 36, fontWeight: 500 }}>
                    → {ex.alt}
                  </div>
                )}

                {/* Sets — each on its own row */}
                <div style={{ marginLeft: 36, display: "flex", flexDirection: "column", gap: 8 }}>
                  {Array.from({ length: ex.sets }, (_, i) => {
                    const setNum = i + 1;
                    const k = `${sessionKey}_${ex.id}_s${setNum}`;
                    const d = data[k] || { weight: "", done: false };
                    return (
                      <div key={setNum} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 32, fontSize: 12, color: C.textDim, fontWeight: 500 }}>
                          S{setNum}
                        </div>
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="lbs"
                          value={d.weight}
                          onChange={(e) => updateSet(sessionKey, ex.id, setNum, "weight", e.target.value)}
                          style={{
                            flex: 1, maxWidth: 80, height: 40,
                            background: "#fff", border: `1.5px solid ${d.done ? C.done : C.border}`,
                            borderRadius: 10, color: C.text, fontFamily: font, fontSize: 15,
                            textAlign: "center", outline: "none",
                          }}
                        />
                        <button
                          onClick={() => updateSet(sessionKey, ex.id, setNum, "done", !d.done)}
                          style={{
                            height: 40, width: 40, borderRadius: 10, cursor: "pointer",
                            border: d.done ? `1.5px solid ${C.done}` : `1.5px solid ${C.border}`,
                            background: d.done ? C.done : "#fff",
                            color: d.done ? "#fff" : C.textDim,
                            fontFamily: font, fontSize: 16, fontWeight: 600,
                            transition: "all 0.15s",
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}
                        >
                          {d.done ? "✓" : ""}
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Divider between exercises */}
                {exIdx < wo.exercises.length - 1 && (
                  <div style={{ height: 1, background: C.border, margin: "20px 0 0 36px" }} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ─── MAIN VIEW ───
  const totalProg = getTotalProgress();
  const weekProg = getWeekProgress(week);

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: font, color: C.text }}>
      {/* Header */}
      <div style={{ padding: "24px 20px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>RECOMP</h1>
            <div style={{ fontSize: 12, color: C.textDim, marginTop: 2, fontWeight: 500 }}>12-Week Program</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ fontSize: 12, color: C.textDim, fontWeight: 500 }}>{Math.round(totalProg * 100)}%</div>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: syncDot }} />
          </div>
        </div>
        <div style={{ height: 4, background: C.border, borderRadius: 2, marginTop: 16 }}>
          <div style={{ height: "100%", width: `${totalProg * 100}%`, background: `linear-gradient(90deg, ${C.accent}, #818cf8)`, borderRadius: 2, transition: "width 0.5s" }} />
        </div>
      </div>

      {/* Week Selector */}
      <div style={{ padding: "20px 20px 8px" }}>
        <div style={{ fontSize: 11, color: C.textDim, letterSpacing: 1.5, marginBottom: 10, textTransform: "uppercase", fontWeight: 600 }}>Week</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 6 }}>
          {Array.from({ length: TOTAL_WEEKS }, (_, i) => {
            const w = i + 1;
            const wp = getWeekProgress(w);
            const isActive = w === week;
            return (
              <button key={w} onClick={() => setWeek(w)} style={{
                height: 42, border: isActive ? `2px solid ${C.accent}` : `1.5px solid ${C.border}`,
                borderRadius: 10, background: wp === 1 ? C.doneLight : "#fff",
                color: isActive ? C.accent : wp === 1 ? C.done : C.textMid,
                fontFamily: font, fontSize: 13, fontWeight: isActive ? 700 : 500,
                cursor: "pointer", position: "relative", overflow: "hidden",
              }}>
                {wp > 0 && wp < 1 && (
                  <div style={{ position: "absolute", bottom: 0, left: 0, width: `${wp * 100}%`, height: 3, background: C.accent, borderRadius: "0 2px 2px 0" }} />
                )}
                {w}
              </button>
            );
          })}
        </div>
      </div>

      {/* Week Progress */}
      <div style={{ padding: "10px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 17, fontWeight: 700 }}>Week {week}</div>
          <div style={{ fontSize: 13, color: weekProg === 1 ? C.done : C.textMid, fontWeight: 500 }}>
            {Math.round(weekProg * 100)}% complete
          </div>
        </div>
        <div style={{ height: 4, background: C.border, borderRadius: 2, marginTop: 8 }}>
          <div style={{ height: "100%", width: `${weekProg * 100}%`, background: weekProg === 1 ? C.done : C.accent, borderRadius: 2, transition: "width 0.3s" }} />
        </div>
      </div>

      {/* Schedule */}
      <div style={{ padding: "10px 20px 32px" }}>
        <div style={{ fontSize: 11, color: C.textDim, letterSpacing: 1.5, marginBottom: 10, textTransform: "uppercase", fontWeight: 600 }}>Schedule</div>
        {DAY_LABELS.map((label, i) => {
          const dayNum = i + 1;
          const wo = WORKOUTS.find((w) => w.day === dayNum);
          const isRest = !wo;
          const prog = wo ? getWorkoutProgress(wo, week) : 0;

          return (
            <button key={dayNum} onClick={() => wo && setActiveWorkout(wo)} disabled={isRest} style={{
              display: "flex", alignItems: "center", width: "100%", padding: "14px 16px",
              background: isRest ? "transparent" : prog === 1 ? C.doneLight : "#fff",
              border: isRest ? `1.5px dashed ${C.border}` : prog === 1 ? `1.5px solid ${C.done}33` : `1.5px solid ${C.border}`,
              borderRadius: 12, marginBottom: 8, cursor: isRest ? "default" : "pointer",
              fontFamily: font, color: C.text, textAlign: "left", transition: "all 0.15s", opacity: isRest ? 0.45 : 1,
            }}>
              <div style={{
                width: 30, height: 30, borderRadius: 8,
                background: isRest ? "transparent" : prog === 1 ? C.done : C.accentLight,
                border: isRest ? `1.5px solid ${C.border}` : "none",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 600, color: prog === 1 ? "#fff" : C.accent,
                marginRight: 14, flexShrink: 0,
              }}>
                {prog === 1 ? "✓" : isRest ? "" : `D${dayNum}`}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{label}</div>
                {wo && <div style={{ fontSize: 12, color: C.textDim, marginTop: 1 }}>{wo.subtitle} · {wo.exercises.length} exercises</div>}
              </div>
              {wo && prog > 0 && prog < 1 && <div style={{ fontSize: 12, color: C.warn, fontWeight: 600 }}>{Math.round(prog * 100)}%</div>}
              {wo && prog === 1 && <div style={{ fontSize: 12, color: C.done, fontWeight: 600 }}>Done</div>}
              {wo && prog === 0 && <div style={{ fontSize: 18, color: C.textDim }}>›</div>}
            </button>
          );
        })}
      </div>

      <div style={{ padding: "0 20px 40px", textAlign: "center" }}>
        <div style={{ fontSize: 10, color: C.textDim, letterSpacing: 1.5, fontWeight: 500 }}>
          PROGRESSIVE OVERLOAD · HIGH PROTEIN · CONSISTENCY
        </div>
      </div>
    </div>
  );
}
