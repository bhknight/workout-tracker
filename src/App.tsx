import { useState, useEffect, useCallback, useRef } from 'react';

const SUPABASE_URL = 'https://zgamhginvurxausvvswi.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnYW1oZ2ludnVyeGF1c3Z2c3dpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMzQxNzYsImV4cCI6MjA5NDgxMDE3Nn0.4xEWvp7aMU8olVFX_E7dG01_YC_ty5AdJyLLr9vzGxE';

async function sbUpsert(row) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/workout_sets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify(row),
  });
  return res.ok;
}

async function sbFetchAll() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/workout_sets?select=*`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });
  if (!res.ok) return [];
  return res.json();
}

const PROGRAM = {
  A: {
    label: 'Day A — Legs',
    color: '#e8ff47',
    exercises: [
      {
        id: 'goblet',
        name: 'DB Goblet Squat',
        alt: 'DB Split Squat',
        sets: 3,
        reps: '10–12',
        rest: '75s',
      },
      {
        id: 'rdl',
        name: 'DB Romanian Deadlift',
        alt: 'Cable Pull-Through',
        sets: 3,
        reps: '10–12',
        rest: '75s',
      },
      {
        id: 'glute',
        name: 'Glute Bridge',
        alt: 'DB Hip Thrust (bench)',
        sets: 3,
        reps: '15',
        rest: '45s',
      },
      {
        id: 'plank',
        name: 'Plank',
        alt: 'Dead Bug',
        sets: 3,
        reps: '30s',
        rest: '45s',
      },
      {
        id: 'hammer',
        name: 'Seated DB Hammer Curl',
        alt: 'Cable Curl',
        sets: 2,
        reps: '12',
        rest: '45s',
      },
    ],
  },
  B: {
    label: 'Day B — Push + Pull',
    color: '#47c8ff',
    exercises: [
      {
        id: 'pushup',
        name: 'Push-Ups',
        alt: 'DB Floor Press',
        sets: 3,
        reps: '8–12',
        rest: '60s',
      },
      {
        id: 'shoulder',
        name: 'DB Shoulder Press',
        alt: 'Cable Lateral Raise',
        sets: 3,
        reps: '10–12',
        rest: '60s',
      },
      {
        id: 'pullup',
        name: 'Pull-Ups',
        alt: 'Cable Lat Pulldown',
        sets: 3,
        reps: '5–8',
        rest: '90s',
      },
      {
        id: 'backext',
        name: 'Back Extensions',
        alt: 'Cable Pull-Through',
        sets: 3,
        reps: '12–15',
        rest: '60s',
      },
      {
        id: 'tricep',
        name: 'Tricep Cable Pushdown',
        alt: 'DB Overhead Extension',
        sets: 2,
        reps: '12–15',
        rest: '45s',
      },
      {
        id: 'curl',
        name: 'DB Curl',
        alt: 'Cable Curl',
        sets: 2,
        reps: '12–15',
        rest: '45s',
      },
    ],
  },
};

function getSchedule(week) {
  return week % 2 !== 0 ? ['B', 'A', 'B'] : ['A', 'B', 'A'];
}

function getWeekSession(week, dayIndex) {
  return `W${week}D${dayIndex + 1}`;
}

const DAYS = ['Monday', 'Wednesday', 'Friday'];

function rowsToMap(rows) {
  const map = {};
  for (const r of rows) {
    const key = `${r.session_key}_${r.exercise_id}_s${r.set_num}`;
    map[key] = { weight: r.weight || '', done: r.done || false };
  }
  return map;
}

function SetRow({
  sessionKey,
  exId,
  setNum,
  reps,
  accentColor,
  onSave,
  savedData,
  saving,
}) {
  const key = `${sessionKey}_${exId}_s${setNum}`;
  const saved = savedData[key] || {};
  const [weight, setWeight] = useState(saved.weight || '');
  const [done, setDone] = useState(saved.done || false);
  const debounceRef = useRef(null);

  useEffect(() => {
    const d = savedData[key] || {};
    setWeight(d.weight || '');
    setDone(d.done || false);
  }, [key, savedData]);

  const handleComplete = () => {
    const newDone = !done;
    setDone(newDone);
    onSave(key, { weight, done: newDone }, sessionKey, exId, setNum);
  };

  const handleWeight = (v) => {
    setWeight(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onSave(key, { weight: v, done }, sessionKey, exId, setNum);
    }, 600);
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '9px 12px',
        background: done ? 'rgba(232,255,71,0.07)' : 'rgba(255,255,255,0.03)',
        borderRadius: 8,
        marginBottom: 5,
        transition: 'background 0.2s',
        opacity: done ? 0.75 : 1,
      }}
    >
      <span
        style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 11,
          color: '#666',
          width: 42,
          flexShrink: 0,
        }}
      >
        SET {setNum}
      </span>
      <span style={{ fontSize: 12, color: '#888', width: 50, flexShrink: 0 }}>
        {reps} reps
      </span>
      <input
        type="number"
        placeholder="lbs"
        value={weight}
        onChange={(e) => handleWeight(e.target.value)}
        style={{
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 6,
          color: '#fff',
          fontSize: 13,
          padding: '4px 8px',
          width: 64,
          outline: 'none',
          fontFamily: "'DM Mono', monospace",
          flexShrink: 0,
        }}
      />
      <button
        onClick={handleComplete}
        style={{
          marginLeft: 'auto',
          background: done ? accentColor : 'transparent',
          border: `1.5px solid ${done ? accentColor : 'rgba(255,255,255,0.2)'}`,
          borderRadius: 20,
          color: done ? '#111' : '#aaa',
          cursor: 'pointer',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.05em',
          padding: '5px 14px',
          transition: 'all 0.18s',
          fontFamily: "'DM Mono', monospace",
          flexShrink: 0,
        }}
      >
        {saving ? '...' : done ? '✓ DONE' : 'COMPLETE'}
      </button>
    </div>
  );
}

function ExerciseCard({
  ex,
  sessionKey,
  accentColor,
  savedData,
  onSave,
  savingKeys,
}) {
  const [expanded, setExpanded] = useState(true);
  const totalSets = ex.sets;
  const completedSets = Array.from({ length: totalSets }, (_, i) => {
    const k = `${sessionKey}_${ex.id}_s${i + 1}`;
    return savedData[k]?.done ? 1 : 0;
  }).reduce((a, b) => a + b, 0);
  const allDone = completedSets === totalSets;

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: `1px solid ${
          allDone ? accentColor + '55' : 'rgba(255,255,255,0.08)'
        }`,
        borderRadius: 12,
        marginBottom: 12,
        overflow: 'hidden',
        transition: 'border-color 0.3s',
      }}
    >
      <div
        onClick={() => setExpanded((e) => !e)}
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '13px 16px',
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                fontFamily: "'Bebas Neue', cursive",
                fontSize: 17,
                letterSpacing: '0.05em',
                color: allDone ? accentColor : '#fff',
                transition: 'color 0.2s',
              }}
            >
              {ex.name}
            </span>
            {allDone && (
              <span
                style={{
                  background: accentColor,
                  color: '#111',
                  fontSize: 10,
                  fontWeight: 800,
                  borderRadius: 20,
                  padding: '2px 8px',
                  fontFamily: "'DM Mono', monospace",
                  letterSpacing: '0.05em',
                }}
              >
                DONE
              </span>
            )}
          </div>
          <div
            style={{
              fontSize: 11,
              color: '#555',
              marginTop: 2,
              fontFamily: "'DM Mono', monospace",
            }}
          >
            Alt: {ex.alt} · {ex.rest} rest
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ textAlign: 'right' }}>
            <div
              style={{
                fontSize: 13,
                color: accentColor,
                fontFamily: "'DM Mono', monospace",
                fontWeight: 700,
              }}
            >
              {completedSets}/{totalSets}
            </div>
            <div
              style={{
                fontSize: 10,
                color: '#555',
                fontFamily: "'DM Mono', monospace",
              }}
            >
              sets
            </div>
          </div>
          <span
            style={{
              color: '#444',
              fontSize: 14,
              display: 'block',
              transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)',
              transition: 'transform 0.2s',
            }}
          >
            ▼
          </span>
        </div>
      </div>
      {expanded && (
        <div style={{ padding: '0 12px 12px' }}>
          {Array.from({ length: totalSets }, (_, i) => {
            const k = `${sessionKey}_${ex.id}_s${i + 1}`;
            return (
              <SetRow
                key={i}
                sessionKey={sessionKey}
                exId={ex.id}
                setNum={i + 1}
                reps={ex.reps}
                accentColor={accentColor}
                onSave={onSave}
                savedData={savedData}
                saving={savingKeys.has(k)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function WorkoutSession({
  week,
  dayIndex,
  onBack,
  savedData,
  onSave,
  savingKeys,
}) {
  const schedule = getSchedule(week);
  const dayType = schedule[dayIndex];
  const day = PROGRAM[dayType];
  const sessionKey = getWeekSession(week, dayIndex);
  const accentColor = day.color;

  const totalSets = day.exercises.reduce((a, ex) => a + ex.sets, 0);
  const completedSets = day.exercises.reduce((a, ex) => {
    return (
      a +
      Array.from({ length: ex.sets }, (_, i) => {
        const k = `${sessionKey}_${ex.id}_s${i + 1}`;
        return savedData[k]?.done ? 1 : 0;
      }).reduce((x, y) => x + y, 0)
    );
  }, 0);
  const pct = Math.round((completedSets / totalSets) * 100);

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 0 40px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '20px 20px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          marginBottom: 20,
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: 'none',
            color: '#aaa',
            borderRadius: 8,
            padding: '8px 12px',
            cursor: 'pointer',
            fontSize: 16,
          }}
        >
          ←
        </button>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 10,
              color: '#555',
              letterSpacing: '0.1em',
              marginBottom: 2,
            }}
          >
            WEEK {week} · {DAYS[dayIndex].toUpperCase()}
          </div>
          <div
            style={{
              fontFamily: "'Bebas Neue', cursive",
              fontSize: 22,
              color: accentColor,
              letterSpacing: '0.05em',
            }}
          >
            {day.label}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div
            style={{
              fontFamily: "'Bebas Neue', cursive",
              fontSize: 28,
              color: accentColor,
              lineHeight: 1,
            }}
          >
            {pct}%
          </div>
          <div
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 9,
              color: '#555',
            }}
          >
            COMPLETE
          </div>
        </div>
      </div>

      <div style={{ padding: '0 20px 20px' }}>
        <div
          style={{
            background: 'rgba(255,255,255,0.06)',
            borderRadius: 4,
            height: 4,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${pct}%`,
              background: accentColor,
              height: '100%',
              borderRadius: 4,
              transition: 'width 0.4s ease',
            }}
          />
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 5,
          }}
        >
          <span
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 10,
              color: '#444',
            }}
          >
            {completedSets} sets done
          </span>
          <span
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 10,
              color: '#444',
            }}
          >
            {totalSets - completedSets} remaining
          </span>
        </div>
      </div>

      <div style={{ padding: '0 16px' }}>
        {day.exercises.map((ex) => (
          <ExerciseCard
            key={ex.id}
            ex={ex}
            sessionKey={sessionKey}
            accentColor={accentColor}
            savedData={savedData}
            onSave={onSave}
            savingKeys={savingKeys}
          />
        ))}
      </div>

      {pct === 100 && (
        <div
          style={{
            margin: '20px 16px 0',
            background: `linear-gradient(135deg, ${accentColor}22, ${accentColor}11)`,
            border: `1px solid ${accentColor}55`,
            borderRadius: 12,
            padding: '20px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 28, marginBottom: 6 }}>💪</div>
          <div
            style={{
              fontFamily: "'Bebas Neue', cursive",
              fontSize: 20,
              color: accentColor,
              letterSpacing: '0.05em',
            }}
          >
            SESSION COMPLETE
          </div>
          <div
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 11,
              color: '#666',
              marginTop: 4,
            }}
          >
            Great work. Rest up.
          </div>
        </div>
      )}
    </div>
  );
}

export default function WorkoutTracker() {
  const [savedData, setSavedData] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingKeys, setSavingKeys] = useState(new Set());
  const [syncStatus, setSyncStatus] = useState('synced'); // "synced" | "saving" | "error"
  const [view, setView] = useState('home');
  const [activeWeek, setActiveWeek] = useState(null);
  const [activeDayIndex, setActiveDayIndex] = useState(null);
  const [currentWeek, setCurrentWeek] = useState(1);

  useEffect(() => {
    sbFetchAll()
      .then((rows) => {
        setSavedData(rowsToMap(rows));
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        setSyncStatus('error');
      });
  }, []);

  const handleSave = useCallback(
    async (key, value, sessionKey, exId, setNum) => {
      setSavedData((prev) => ({ ...prev, [key]: value }));
      setSavingKeys((prev) => new Set(prev).add(key));
      setSyncStatus('saving');
      const ok = await sbUpsert({
        session_key: sessionKey,
        exercise_id: exId,
        set_num: setNum,
        weight: value.weight || null,
        done: value.done,
      });
      setSavingKeys((prev) => {
        const s = new Set(prev);
        s.delete(key);
        return s;
      });
      setSyncStatus(ok ? 'synced' : 'error');
    },
    []
  );

  const getSessionProgress = (week, dayIndex) => {
    const schedule = getSchedule(week);
    const dayType = schedule[dayIndex];
    const day = PROGRAM[dayType];
    const sessionKey = getWeekSession(week, dayIndex);
    const total = day.exercises.reduce((a, ex) => a + ex.sets, 0);
    const done = day.exercises.reduce((a, ex) => {
      return (
        a +
        Array.from({ length: ex.sets }, (_, i) => {
          const k = `${sessionKey}_${ex.id}_s${i + 1}`;
          return savedData[k]?.done ? 1 : 0;
        }).reduce((x, y) => x + y, 0)
      );
    }, 0);
    return { done, total, pct: Math.round((done / total) * 100) };
  };

  const statusDot = { synced: '#4cff91', saving: '#e8ff47', error: '#ff4747' }[
    syncStatus
  ];
  const statusLabel = {
    synced: 'SYNCED',
    saving: 'SAVING...',
    error: 'SYNC ERROR',
  }[syncStatus];

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#0d0d0d',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontFamily: "'Bebas Neue', cursive",
              fontSize: 28,
              color: '#fff',
              letterSpacing: '0.1em',
              marginBottom: 8,
            }}
          >
            LOADING
          </div>
          <div
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 11,
              color: '#444',
            }}
          >
            Fetching your data...
          </div>
        </div>
      </div>
    );
  }

  if (view === 'session') {
    return (
      <div style={{ minHeight: '100vh', background: '#0d0d0d', color: '#fff' }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@400;500&display=swap'); * { box-sizing: border-box; } input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; } input[type=number] { -moz-appearance: textfield; }`}</style>
        {/* Sync status bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
          }}
        >
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: statusDot,
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 9,
              color: '#444',
              letterSpacing: '0.1em',
            }}
          >
            {statusLabel}
          </span>
        </div>
        <WorkoutSession
          week={activeWeek}
          dayIndex={activeDayIndex}
          onBack={() => setView('home')}
          savedData={savedData}
          onSave={handleSave}
          savingKeys={savingKeys}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0d0d0d',
        color: '#fff',
        fontFamily: 'sans-serif',
      }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@400;500&display=swap'); * { box-sizing: border-box; } input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; } input[type=number] { -moz-appearance: textfield; } ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #111; } ::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }`}</style>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '28px 20px' }}>
        {/* Title + sync status */}
        <div style={{ marginBottom: 28 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 4,
            }}
          >
            <div
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 10,
                color: '#444',
                letterSpacing: '0.15em',
              }}
            >
              8-WEEK PROGRAM · 3×/WEEK
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: statusDot,
                }}
              />
              <span
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 9,
                  color: '#444',
                  letterSpacing: '0.08em',
                }}
              >
                {statusLabel}
              </span>
            </div>
          </div>
          <div
            style={{
              fontFamily: "'Bebas Neue', cursive",
              fontSize: 36,
              letterSpacing: '0.06em',
              lineHeight: 1,
              color: '#fff',
            }}
          >
            WORKOUT TRACKER
          </div>
          <div
            style={{
              display: 'flex',
              gap: 10,
              marginTop: 14,
              alignItems: 'center',
            }}
          >
            <span
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 11,
                color: '#555',
              }}
            >
              WEEK
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((w) => (
                <button
                  key={w}
                  onClick={() => setCurrentWeek(w)}
                  style={{
                    background:
                      currentWeek === w ? '#fff' : 'rgba(255,255,255,0.06)',
                    border: 'none',
                    color: currentWeek === w ? '#111' : '#666',
                    borderRadius: 6,
                    padding: '4px 9px',
                    cursor: 'pointer',
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 12,
                    fontWeight: currentWeek === w ? 700 : 400,
                    transition: 'all 0.15s',
                  }}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>
        </div>

        {(() => {
          const schedule = getSchedule(currentWeek);
          const pattern = currentWeek % 2 !== 0 ? 'B · A · B' : 'A · B · A';
          return (
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 14,
                }}
              >
                <div>
                  <span
                    style={{
                      fontFamily: "'Bebas Neue', cursive",
                      fontSize: 22,
                      color: '#fff',
                      letterSpacing: '0.05em',
                    }}
                  >
                    WEEK {currentWeek}
                  </span>
                  <span
                    style={{
                      marginLeft: 10,
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 10,
                      color: '#555',
                      letterSpacing: '0.08em',
                    }}
                  >
                    {currentWeek % 2 !== 0 ? 'ODD' : 'EVEN'} · {pattern}
                  </span>
                </div>
              </div>

              <div
                style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
              >
                {DAYS.map((dayName, i) => {
                  const type = schedule[i];
                  const prog = getSessionProgress(currentWeek, i);
                  const accentColor = PROGRAM[type].color;
                  const isComplete = prog.pct === 100;
                  return (
                    <button
                      key={i}
                      onClick={() => {
                        setActiveWeek(currentWeek);
                        setActiveDayIndex(i);
                        setView('session');
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 16,
                        background: isComplete
                          ? `linear-gradient(135deg, ${accentColor}18, ${accentColor}08)`
                          : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${
                          isComplete
                            ? accentColor + '55'
                            : 'rgba(255,255,255,0.08)'
                        }`,
                        borderRadius: 14,
                        padding: '16px 18px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        width: '100%',
                        transition: 'all 0.18s',
                      }}
                    >
                      <div
                        style={{
                          background: accentColor,
                          color: '#111',
                          borderRadius: 10,
                          width: 44,
                          height: 44,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "'Bebas Neue', cursive",
                            fontSize: 18,
                            lineHeight: 1,
                            letterSpacing: '0.03em',
                          }}
                        >
                          {type}
                        </span>
                        <span
                          style={{
                            fontFamily: "'DM Mono', monospace",
                            fontSize: 8,
                            fontWeight: 700,
                          }}
                        >
                          DAY
                        </span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontFamily: "'Bebas Neue', cursive",
                            fontSize: 16,
                            color: '#fff',
                            letterSpacing: '0.04em',
                          }}
                        >
                          {dayName}
                        </div>
                        <div
                          style={{
                            fontFamily: "'DM Mono', monospace",
                            fontSize: 10,
                            color: '#555',
                            marginTop: 1,
                          }}
                        >
                          {PROGRAM[type].label
                            .replace('Day A — ', '')
                            .replace('Day B — ', '')}
                        </div>
                        <div
                          style={{
                            marginTop: 7,
                            background: 'rgba(255,255,255,0.07)',
                            borderRadius: 3,
                            height: 3,
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${prog.pct}%`,
                              background: accentColor,
                              height: '100%',
                              borderRadius: 3,
                              transition: 'width 0.4s',
                            }}
                          />
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        {isComplete ? (
                          <div
                            style={{
                              fontFamily: "'DM Mono', monospace",
                              fontSize: 11,
                              color: accentColor,
                              fontWeight: 700,
                            }}
                          >
                            ✓ DONE
                          </div>
                        ) : (
                          <>
                            <div
                              style={{
                                fontFamily: "'Bebas Neue', cursive",
                                fontSize: 22,
                                color: prog.done > 0 ? accentColor : '#333',
                                lineHeight: 1,
                              }}
                            >
                              {prog.pct}%
                            </div>
                            <div
                              style={{
                                fontFamily: "'DM Mono', monospace",
                                fontSize: 9,
                                color: '#444',
                              }}
                            >
                              {prog.done}/{prog.total} sets
                            </div>
                          </>
                        )}
                        <div
                          style={{ color: '#333', fontSize: 14, marginTop: 4 }}
                        >
                          ›
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div
                style={{
                  marginTop: 20,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 12,
                  padding: '16px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                }}
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 10,
                      color: '#444',
                      marginBottom: 6,
                    }}
                  >
                    WEEK {currentWeek} OVERALL
                  </div>
                  {(() => {
                    const progs = [0, 1, 2].map((i) =>
                      getSessionProgress(currentWeek, i)
                    );
                    const td = progs.reduce((a, p) => a + p.done, 0);
                    const ta = progs.reduce((a, p) => a + p.total, 0);
                    const pct = Math.round((td / ta) * 100);
                    return (
                      <>
                        <div
                          style={{
                            background: 'rgba(255,255,255,0.06)',
                            borderRadius: 4,
                            height: 6,
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${pct}%`,
                              background:
                                'linear-gradient(90deg, #47c8ff, #e8ff47)',
                              height: '100%',
                              borderRadius: 4,
                              transition: 'width 0.4s',
                            }}
                          />
                        </div>
                        <div
                          style={{
                            fontFamily: "'DM Mono', monospace",
                            fontSize: 10,
                            color: '#555',
                            marginTop: 4,
                          }}
                        >
                          {td} of {ta} sets complete
                        </div>
                      </>
                    );
                  })()}
                </div>
                <div
                  style={{
                    fontFamily: "'Bebas Neue', cursive",
                    fontSize: 32,
                    color: '#fff',
                    lineHeight: 1,
                  }}
                >
                  {(() => {
                    const p = [0, 1, 2].map((i) =>
                      getSessionProgress(currentWeek, i)
                    );
                    return Math.round(
                      (p.reduce((a, x) => a + x.done, 0) /
                        p.reduce((a, x) => a + x.total, 0)) *
                        100
                    );
                  })()}
                  %
                </div>
              </div>
            </div>
          );
        })()}

        <div style={{ marginTop: 28, display: 'flex', gap: 12 }}>
          {['A', 'B'].map((type) => (
            <div
              key={type}
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.03)',
                borderRadius: 10,
                padding: '12px 14px',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  marginBottom: 6,
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: PROGRAM[type].color,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontFamily: "'Bebas Neue', cursive",
                    fontSize: 14,
                    color: PROGRAM[type].color,
                    letterSpacing: '0.05em',
                  }}
                >
                  {PROGRAM[type].label}
                </span>
              </div>
              {PROGRAM[type].exercises.map((ex) => (
                <div
                  key={ex.id}
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 9,
                    color: '#444',
                    lineHeight: 1.7,
                  }}
                >
                  {ex.name}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
