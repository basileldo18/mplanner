'use server';

import { sql } from './db';
import { revalidatePath } from 'next/cache';

export type StudySession = {
  id: string;
  date: string;
  topic: string; // Section ID
  subTopic?: string;
  subTopics: string[];
  timeSpent: number;
  questionsDone: number;
  conceptMastered: boolean;
};

export async function getSessions(): Promise<StudySession[]> {
  try {
    const result = await sql`
      SELECT id, date, section as topic, sub_topics as "subTopics", time_spent as "timeSpent", 
             questions_done as "questionsDone", concept_mastered as "conceptMastered"
      FROM sessions
      ORDER BY date DESC
    `;
    
    return result.map(row => ({
      id: row.id,
      date: row.date instanceof Date ? row.date.toISOString() : row.date,
      topic: row.topic,
      subTopic: row.subTopic,
      subTopics: row.subTopics || [],
      timeSpent: parseFloat(row.timeSpent),
      questionsDone: parseInt(row.questionsDone),
      conceptMastered: row.conceptMastered
    }));
  } catch (error) {
    console.error('Failed to fetch sessions:', error);
    return [];
  }
}

export async function saveSession(session: StudySession) {
  try {
    await sql`
      INSERT INTO sessions (id, date, section, sub_topics, time_spent, questions_done, concept_mastered)
      VALUES (${session.id}, ${session.date}, ${session.topic}, ${session.subTopics}, ${session.timeSpent}, ${session.questionsDone}, ${session.conceptMastered})
      ON CONFLICT (id) DO UPDATE SET
        date = EXCLUDED.date,
        section = EXCLUDED.section,
        sub_topics = EXCLUDED.sub_topics,
        time_spent = EXCLUDED.time_spent,
        questions_done = EXCLUDED.questions_done,
        concept_mastered = EXCLUDED.concept_mastered
    `;
    revalidatePath('/');
  } catch (error) {
    console.error('Failed to save session:', error);
    throw new Error('Database save failed');
  }
}

export async function deleteSession(id: string) {
  try {
    await sql`DELETE FROM sessions WHERE id = ${id}`;
    revalidatePath('/');
  } catch (error) {
    console.error('Failed to delete session:', error);
    throw new Error('Database delete failed');
  }
}

export async function clearAllSessions() {
  try {
    await sql`DELETE FROM sessions`;
    revalidatePath('/');
  } catch (error) {
    console.error('Failed to clear sessions:', error);
    throw new Error('Database clear failed');
  }
}

export type DailyTask = {
  id: string;
  date: string;
  taskName: string;
  completed: boolean;
};

export async function getDailyTasks(): Promise<DailyTask[]> {
  try {
    const result = await sql`
      SELECT id, date::text, task_name as "taskName", completed
      FROM daily_tasks
      ORDER BY date DESC
    `;
    return result.map(row => ({
      id: row.id,
      date: row.date,
      taskName: row.taskName,
      completed: row.completed
    }));
  } catch (error) {
    console.error('Failed to fetch daily tasks:', error);
    return [];
  }
}

export async function toggleDailyTask(id: string, date: string, taskName: string, completed: boolean) {
  try {
    await sql`
      INSERT INTO daily_tasks (id, date, task_name, completed)
      VALUES (${id}, ${date}, ${taskName}, ${completed})
      ON CONFLICT (date, task_name) DO UPDATE SET
        completed = EXCLUDED.completed
    `;
    revalidatePath('/');
  } catch (error) {
    console.error('Failed to toggle daily task:', error);
    throw new Error('Database update failed');
  }
}