import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getDb, saveDb, initDb } from '../../../../server/database/schema';

async function ensureDb() {
  try {
    return getDb();
  } catch (e) {
    return await initDb();
  }
}

// Get history of an exercise
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const exercise_name = searchParams.get('exercise_name');

  const db = await ensureDb();
  
  if (!exercise_name) {
      return NextResponse.json({ error: 'exercise_name is required' }, { status: 400 });
  }

  const logsRes = db.exec(`
    SELECT * FROM Workout_Logs 
    WHERE exercise_name = ? 
    ORDER BY timestamp DESC LIMIT 10
  `, [exercise_name]);

  const logs = logsRes.length > 0 ? 
    logsRes[0].values.map((v: any) => {
        const row: any = {};
        logsRes[0].columns.forEach((col: string, i: number) => row[col] = v[i]);
        return row;
    }) : [];

  return NextResponse.json(logs);
}

// Log a new exercise result
export async function POST(req: Request) {
  const body = await req.json();
  const { session_id, exercise_name, sets, reps, weight, ai_feedback } = body;

  const db = await ensureDb();
  
  // If no session exists, we should create a daily one
  let activeSessionId = session_id;
  if (!activeSessionId) {
      const sessionId = crypto.randomUUID();
      db.run(`
        INSERT INTO Workout_Sessions (id, user_id, session_date)
        VALUES (?, 'default_user', CURRENT_DATE)
      `, [sessionId]);
      saveDb(); // save to avoid locking issues in subsequent steps
      activeSessionId = sessionId;
  }

  const logId = crypto.randomUUID();
  db.run(`
    INSERT INTO Workout_Logs (id, session_id, exercise_name, sets, reps, weight, ai_feedback)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [logId, activeSessionId, exercise_name, sets, reps, weight, ai_feedback || '']);

  saveDb();

  return NextResponse.json({ success: true, log_id: logId, session_id: activeSessionId });
}
