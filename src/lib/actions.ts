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
  isPractice: boolean;
  topicQuestions?: Record<string, number>;
};

export async function getSessions(): Promise<StudySession[]> {
  try {
    const result = await sql`
      SELECT id, date, section as topic, sub_topics as "subTopics", time_spent as "timeSpent", 
             questions_done as "questionsDone", concept_mastered as "conceptMastered",
             is_practice as "isPractice", topic_questions as "topicQuestions"
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
      conceptMastered: row.conceptMastered,
      isPractice: row.isPractice || false,
      topicQuestions: row.topicQuestions || {}
    }));
  } catch (error) {
    console.error('Failed to fetch sessions:', error);
    return [];
  }
}

export async function saveSession(session: StudySession) {
  try {
    await sql`
      INSERT INTO sessions (id, date, section, sub_topics, time_spent, questions_done, concept_mastered, is_practice, topic_questions)
      VALUES (${session.id}, ${session.date}, ${session.topic}, ${session.subTopics}, ${session.timeSpent}, ${session.questionsDone}, ${session.conceptMastered}, ${session.isPractice}, ${session.topicQuestions || {}})
      ON CONFLICT (id) DO UPDATE SET
        date = EXCLUDED.date,
        section = EXCLUDED.section,
        sub_topics = EXCLUDED.sub_topics,
        time_spent = EXCLUDED.time_spent,
        questions_done = EXCLUDED.questions_done,
        concept_mastered = EXCLUDED.concept_mastered,
        is_practice = EXCLUDED.is_practice,
        topic_questions = EXCLUDED.topic_questions
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

export async function resetTopicSessions(sectionId: string, topicName: string) {
  try {
    // This is a robust way to handle both JSONB and Text Array types in Postgres
    // 1. Delete sessions that only have this topic
    await sql`
      DELETE FROM sessions 
      WHERE section = ${sectionId} 
      AND (
        sub_topics::jsonb = ${JSON.stringify([topicName])}::jsonb
        OR (sub_topics::text[] = ARRAY[${topicName}])
      )
    `;

    // 2. Remove topic from multi-topic sessions
    // Using a safe replace/filter logic for Postgres
    await sql`
      UPDATE sessions
      SET sub_topics = (
        SELECT jsonb_agg(elem)
        FROM jsonb_array_elements(sub_topics::jsonb) AS elem
        WHERE elem #>> '{}' != ${topicName}
      )
      WHERE section = ${sectionId} 
      AND sub_topics::jsonb ? ${topicName}
      AND jsonb_array_length(sub_topics::jsonb) > 1
    `;

    revalidatePath('/');
  } catch (error) {
    console.error('Failed to reset topic progress:', error);
    throw new Error('Database reset failed');
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