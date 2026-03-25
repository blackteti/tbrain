import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getDb, saveDb, initDb } from '../../../server/database/schema';

// Helper to ensure DB is loaded (in dev, hot reloads might reset instances)
async function ensureDb() {
  try {
    return getDb();
  } catch (e) {
    return await initDb();
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const user_id = searchParams.get('user_id') || 'default_user'; // For now hardcoded or passed

  const db = await ensureDb();
  
  // Get all routines
  const routinesRes = db.exec(`SELECT * FROM Workout_Routines WHERE user_id = '${user_id}' ORDER BY created_at ASC`);
  const routines = routinesRes.length > 0 ? 
    routinesRes[0].values.map((v: any) => {
        const row: any = {};
        routinesRes[0].columns.forEach((col: string, i: number) => row[col] = v[i]);
        return row;
    }) : [];
    
  // Get exercises for each routine
  for (const routine of routines) {
      const exRes = db.exec(`SELECT * FROM Workout_Exercises WHERE routine_id = '${routine.id}' ORDER BY order_index ASC`);
      routine.exercises = exRes.length > 0 ? 
        exRes[0].values.map((v: any) => {
            const row: any = {};
            exRes[0].columns.forEach((col: string, i: number) => row[col] = v[i]);
            return row;
        }) : [];
  }

  return NextResponse.json(routines);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { name, description, user_id, exercises } = body;

  const db = await ensureDb();
  const id = crypto.randomUUID();

  // Create routine
  db.run(`
    INSERT INTO Workout_Routines (id, user_id, name, description)
    VALUES (?, ?, ?, ?)
  `, [id, user_id || 'default_user', name, description || '']);

  // Create exercises if any
  if (exercises && Array.isArray(exercises)) {
      exercises.forEach((ex: any, idx: number) => {
          const exId = crypto.randomUUID();
          db.run(`
            INSERT INTO Workout_Exercises (id, routine_id, name, muscle_group, order_index)
            VALUES (?, ?, ?, ?, ?)
          `, [exId, id, ex.name, ex.muscle_group || null, idx]);
      });
  }

  saveDb();

  return NextResponse.json({ success: true, id });
}
