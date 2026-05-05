CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  section TEXT NOT NULL,
  sub_topics TEXT[] NOT NULL,
  time_spent FLOAT NOT NULL,
  questions_done INTEGER DEFAULT 0,
  concept_mastered BOOLEAN DEFAULT FALSE
);

CREATE TABLE daily_tasks (
  id TEXT PRIMARY KEY,
  date DATE NOT NULL,
  task_name TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  UNIQUE(date, task_name)
);
