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
    // 1. Fetch all sessions for this section
    const sessions = await sql`
      SELECT id, sub_topics as "subTopics"
      FROM sessions
      WHERE section = ${sectionId}
    `;

    for (const session of sessions) {
      // Handle potential variations in how sub_topics is returned (JSONB array or string)
      let subTopics: string[] = [];
      try {
        if (Array.isArray(session.subTopics)) {
          subTopics = session.subTopics;
        } else if (typeof session.subTopics === 'string') {
          subTopics = JSON.parse(session.subTopics);
        }
      } catch (e) {
        console.error("Error parsing subTopics:", e);
        continue;
      }

      if (subTopics.includes(topicName)) {
        const filtered = subTopics.filter((t: string) => t !== topicName);
        
        if (filtered.length === 0) {
          // If no topics left, delete the whole session
          await sql`DELETE FROM sessions WHERE id = ${session.id}`;
        } else {
          // Update the session with filtered topics
          // We use JSON.stringify to ensure it's stored correctly regardless of column type
          await sql`
            UPDATE sessions 
            SET sub_topics = ${JSON.stringify(filtered)}
            WHERE id = ${session.id}
          `;
        }
      }
    }

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

export type ResourceNote = {
  id: string;
  name: string;
  content: string; // base64
  createdAt?: string;
};

export async function getResourceNotes(): Promise<ResourceNote[]> {
  try {
    const result = await sql`
      SELECT id, name, content, created_at as "createdAt"
      FROM resource_notes
      ORDER BY created_at DESC
    `;
    return result.map(row => ({
      id: row.id,
      name: row.name,
      content: row.content,
      createdAt: row.createdAt
    }));
  } catch (error) {
    console.error('Failed to fetch resource notes:', error);
    return [];
  }
}

export async function saveResourceNote(note: ResourceNote) {
  try {
    await sql`
      INSERT INTO resource_notes (id, name, content)
      VALUES (${note.id}, ${note.name}, ${note.content})
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        content = EXCLUDED.content
    `;
    revalidatePath('/');
  } catch (error) {
    console.error('Failed to save resource note:', error);
    throw new Error('Database save failed');
  }
}

export async function deleteResourceNote(id: string) {
  try {
    await sql`DELETE FROM resource_notes WHERE id = ${id}`;
    revalidatePath('/');
  } catch (error) {
    console.error('Failed to delete resource note:', error);
    throw new Error('Database delete failed');
  }
}

export type TopicShortcut = {
  id: string;
  topicName: string;
  title: string;
  imageData: string; // base64
  createdAt?: string;
};

export async function getTopicShortcuts(): Promise<TopicShortcut[]> {
  try {
    const result = await sql`
      SELECT id, topic_name as "topicName", title, image_data as "imageData", created_at as "createdAt"
      FROM topic_shortcuts
      ORDER BY created_at DESC
    `;
    return result.map(row => ({
      id: row.id,
      topicName: row.topicName,
      title: row.title || 'Untitled Trick',
      imageData: row.imageData,
      createdAt: row.createdAt
    }));
  } catch (error) {
    console.error('Failed to fetch topic shortcuts:', error);
    return [];
  }
}

export async function saveTopicShortcut(shortcut: TopicShortcut) {
  try {
    await sql`
      INSERT INTO topic_shortcuts (id, topic_name, title, image_data)
      VALUES (${shortcut.id}, ${shortcut.topicName}, ${shortcut.title}, ${shortcut.imageData})
    `;
    revalidatePath('/');
  } catch (error) {
    console.error('Failed to save topic shortcut:', error);
    throw new Error('Database save failed');
  }
}

export async function deleteTopicShortcut(id: string) {
  try {
    await sql`DELETE FROM topic_shortcuts WHERE id = ${id}`;
    revalidatePath('/');
  } catch (error) {
    console.error('Failed to delete topic shortcut:', error);
    throw new Error('Database delete failed');
  }
}

export type ImportantQuestion = {
  id: string;
  topicName: string;
  title: string;
  imageData: string; // base64
  createdAt?: string;
};

export async function getImportantQuestions(): Promise<ImportantQuestion[]> {
  try {
    const result = await sql`
      SELECT id, topic_name as "topicName", title, image_data as "imageData", created_at as "createdAt"
      FROM important_questions
      ORDER BY created_at DESC
    `;
    return result.map(row => ({
      id: row.id,
      topicName: row.topicName,
      title: row.title || 'Untitled Question',
      imageData: row.imageData,
      createdAt: row.createdAt
    }));
  } catch (error) {
    console.error('Failed to fetch important questions:', error);
    return [];
  }
}

export async function saveImportantQuestion(question: ImportantQuestion) {
  try {
    await sql`
      INSERT INTO important_questions (id, topic_name, title, image_data)
      VALUES (${question.id}, ${question.topicName}, ${question.title}, ${question.imageData})
    `;
    revalidatePath('/');
  } catch (error) {
    console.error('Failed to save important question:', error);
    throw new Error('Database save failed');
  }
}

export async function deleteImportantQuestion(id: string) {
  try {
    await sql`DELETE FROM important_questions WHERE id = ${id}`;
    revalidatePath('/');
  } catch (error) {
    console.error('Failed to delete important question:', error);
    throw new Error('Database delete failed');
  }
}