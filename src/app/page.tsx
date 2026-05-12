"use client";

import React, { useState, useEffect, useRef } from 'react';
import styles from './page.module.css';
import { 
  BookOpen, 
  Clock, 
  Target, 
  TrendingUp, 
  CalendarDays,
  CheckCircle2,
  BarChart3,
  Flame,
  Plus,
  ChevronDown,
  ChevronUp,
  X,
  Play,
  Square,
  Info,
  LayoutDashboard,
  History,
  Search,
  CheckCircle,
  AlertTriangle,
  Calendar,
  FileUp,
  FileText,
  Trash2,
  ExternalLink,
  ImageOff,
  Image,
  List,
  Check
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { differenceInDays, format, subDays, isSameDay, addDays } from 'date-fns';
import { getSessions, saveSession, deleteSession, clearAllSessions, resetTopicSessions, getDailyTasks, toggleDailyTask, getResourceNotes, saveResourceNote, deleteResourceNote, getTopicShortcuts, saveTopicShortcut, deleteTopicShortcut, getImportantQuestions, saveImportantQuestion, deleteImportantQuestion, type StudySession, type DailyTask, type ResourceNote, type TopicShortcut, type ImportantQuestion } from '@/lib/actions';


const SYLLABUS_TOPICS = [
  { id: 'quants', name: 'Quantitative Aptitude', totalQuestions: 2000, expectedHours: 150, colorClass: styles.fillQuants, color: '#8B5CF6' },
  { id: 'verbal', name: 'Verbal Ability (VARC)', totalQuestions: 1500, expectedHours: 100, colorClass: styles.fillVerbal, color: '#10B981' },
  { id: 'dilr', name: 'Data Interpretation (DILR)', totalQuestions: 1500, expectedHours: 120, colorClass: styles.fillDILR, color: '#06B6D4' },
];

const CAT_SYLLABUS: Record<string, { category: string, topics: string[], importance: 'High' | 'Moderate' | 'Low' }[]> = {
  quants: [
    { category: 'Arithmetic', importance: 'High', topics: ['Percentages', 'Profit & Loss', 'SI & CI', 'Ratio & Proportion', 'Averages', 'Mixtures and Allegations', 'Time & Work', 'Pipes & Cisterns', 'Time, Speed & Distance', 'Races', 'Trains & Boats'] },
    { category: 'Algebra', importance: 'High', topics: ['Linear Equations', 'Quadratic Equations', 'Polynomials', 'Indices & Surds', 'Logarithms', 'Inequalities', 'Sequence Series', 'Functions', 'Graphs', 'Modulus'] },
    { category: 'Geometry', importance: 'Moderate', topics: ['Triangles', 'Quadrilaterals', 'Polygons', 'Circles', 'Mensuration - 3D', 'Coordinate Geo'] },
    { category: 'Number System', importance: 'Moderate', topics: ['Properties of Integer', 'Divisibility', 'Factors', 'Ratio & Proportion', 'LCM & HCF', 'Factorial', 'Trailing Zeroes', 'Last Digits'] },
    { category: 'Modern Maths', importance: 'Low', topics: ['Set Theory', 'Probability', 'Permutation & Combination'] }
  ],
  verbal: [
    { category: 'Reading Comprehension (16 Qs)', importance: 'High', topics: ['4 RC Sets (4 Qs each)', 'History Genres', 'Art & Culture Genres', 'Business & Economics', 'Society & Politics', 'Environmental', 'Science & Technology', 'Psychology & Philosophy', 'Abstract'] },
    { category: 'Verbal Ability (8 Qs)', importance: 'Moderate', topics: ['Para Summary (1-3 Qs)', 'Odd One Out (1-3 Qs)', 'Para Jumbles (1-3 Qs)', 'Para Completion (1-3 Qs)'] }
  ],
  dilr: [
    { category: 'Data Interpretation', importance: 'High', topics: ['Pie Charts', 'DI Tables', 'Line & Bar Graphs', 'Scatter Chart', 'Caselets', 'Quant-based DI', 'Table & Graphs'] },
    { category: 'Logical Reasoning', importance: 'High', topics: [
      'Important concepts in logical reasoning',
      'Logical reasoning based on arrangement',
      'Logical reasoning based ranking',
      'Team formation',
      'Quantitative reasoning',
      'Generic puzzles',
      'Routes and network diagrams',
      'Set theory and venn diagrams',
      'Cubes and dices',
      'Games and tournments',
      'Puzzles on scheduling',
      'Cryptarithemetic'
    ] }
  ]
};

const ALL_SYLLABUS_TOPICS_SET = new Set(
  Object.values(CAT_SYLLABUS).flatMap(section => 
    section.flatMap(cat => cat.topics)
  )
);

const ALGEBRA_PLAN = [
  { topic: 'Indices & Surds', name: 'Exponents (Part 1)', days: 2, startDay: 9, startMonth: 4 }, // May 09-10
  { topic: 'Polynomials', name: 'Polynomials', days: 1, startDay: 11, startMonth: 4 }, // May 11
  { topic: 'Indices & Surds', name: 'Indices & Surds (Part 2)', days: 2, startDay: 12, startMonth: 4 }, // May 12-13
  { topic: 'Logarithms', name: 'Logarithms', days: 2, startDay: 14, startMonth: 4 }, // May 14-15
  { topic: 'Algebra Revision', name: 'Mid-way Revision (L1 & L2 Qs)', days: 2, startDay: 16, startMonth: 4 }, // May 16-17
  { topic: 'Inequalities', name: 'Inequalities', days: 2, startDay: 18, startMonth: 4 }, // May 18-19
  { topic: 'Sequence Series', name: 'Sequence & Series', days: 3, startDay: 20, startMonth: 4 }, // May 20-22
  { topic: 'Algebra Revision', name: 'Revision (Inequalities & Sequences)', days: 2, startDay: 23, startMonth: 4 }, // May 23-24
  { topic: 'Functions', name: 'Functions', days: 2, startDay: 25, startMonth: 4 }, // May 25-26
  { topic: 'Graphs', name: 'Graphs', days: 2, startDay: 27, startMonth: 4 }, // May 27-28
  { topic: 'Modulus', name: 'Modulus', days: 1, startDay: 29, startMonth: 4 }, // May 29
  { topic: 'Algebra Revision', name: 'Revision (Functions, Graphs, Modulus)', days: 2, startDay: 30, startMonth: 4 }, // May 30-31
];

const ARITHMETIC_PLAN = [
  { topic: 'Mixtures and Allegations', name: 'Mixtures & Allegations', days: 3, startDay: 1, startMonth: 5 }, // June 01-03
  { topic: 'SI & CI', name: 'Simple & Compound Interest', days: 2, startDay: 4, startMonth: 5 }, // June 04-05
  { topic: 'Arithmetic Revision', name: 'Revision (Mixtures & SI/CI)', days: 2, startDay: 6, startMonth: 5 }, // June 06-07
  { topic: 'Time and Work', name: 'Time & Work', days: 4, startDay: 8, startMonth: 5 }, // June 08-11
  { topic: 'Averages', name: 'Averages', days: 1, startDay: 12, startMonth: 5 }, // June 12
  { topic: 'Arithmetic Revision', name: 'Revision (Time & Work, Averages)', days: 2, startDay: 13, startMonth: 5 }, // June 13-14
  { topic: 'Pipes and Cisterns', name: 'Pipes & Cisterns', days: 3, startDay: 15, startMonth: 5 }, // June 15-17
  { topic: 'Percentages', name: 'Percentages', days: 2, startDay: 18, startMonth: 5 }, // June 18-19
  { topic: 'Arithmetic Revision', name: 'Revision (Pipes & Percentages)', days: 2, startDay: 20, startMonth: 5 }, // June 20-21
  { topic: 'Time Speed Distance', name: 'Time, Speed & Distance', days: 3, startDay: 22, startMonth: 5 }, // June 22-24
  { topic: 'Profit and Loss', name: 'Profit & Loss', days: 2, startDay: 25, startMonth: 5 }, // June 25-26
  { topic: 'Arithmetic Revision', name: 'Revision (TSD & Profit Loss)', days: 2, startDay: 27, startMonth: 5 }, // June 27-28
];

const GEOMETRY_PLAN = [
  { topic: 'Triangles', name: 'Triangles', days: 3, startDay: 29, startMonth: 5 }, // June 29 - July 01
  { topic: 'Quadrilaterals', name: 'Quadrilaterals', days: 2, startDay: 2, startMonth: 6 }, // July 02-03
  { topic: 'Geometry Revision', name: 'Revision (Triangles & Quads)', days: 2, startDay: 4, startMonth: 6 }, // July 04-05
  { topic: 'Polygons & Circles', name: 'Polygons, Circles & Mensuration', days: 5, startDay: 6, startMonth: 6 }, // July 06-10
  { topic: 'Geometry Revision', name: 'Revision (Polygons, Circles, Mensuration)', days: 2, startDay: 11, startMonth: 6 }, // July 11-12
];

const MODERN_MATHS_PLAN = [
  { topic: 'Permutation and Combination', name: 'Permutation & Combination', days: 3, startDay: 13, startMonth: 6 }, // July 13-15
  { topic: 'Set Theory', name: 'Set Theory', days: 2, startDay: 16, startMonth: 6 }, // July 16-17
  { topic: 'Modern Maths Revision', name: 'Probability & Modern Maths Revision', days: 2, startDay: 18, startMonth: 6 }, // July 18-19
];

const LR_PLAN = [
  { topic: 'Important concepts in logical reasoning', name: 'LR Fundamentals', days: 3, startDay: 11, startMonth: 4 }, // May 11-13
  { topic: 'Logical reasoning based on arrangement', name: 'Arrangements', days: 2, startDay: 14, startMonth: 4 }, // May 14-15
  { topic: 'Logical Reasoning Revision', name: 'Revision (LR Concepts & Arrangements)', days: 2, startDay: 16, startMonth: 4 }, // May 16-17
  { topic: 'Logical reasoning based ranking', name: 'Ranking Puzzles', days: 3, startDay: 18, startMonth: 4 }, // May 18-20
  { topic: 'Team formation', name: 'Team Formation', days: 2, startDay: 21, startMonth: 4 }, // May 21-22
  { topic: 'Logical Reasoning Revision', name: 'Revision (Ranking & Team Formation)', days: 2, startDay: 23, startMonth: 4 }, // May 23-24
  { topic: 'Quantitative reasoning', name: 'Quantitative Reasoning', days: 3, startDay: 25, startMonth: 4 }, // May 25-27
  { topic: 'Generic puzzles', name: 'Generic Puzzles', days: 2, startDay: 28, startMonth: 4 }, // May 28-29
  { topic: 'Logical Reasoning Revision', name: 'Revision (Quant Reasoning & Puzzles)', days: 2, startDay: 30, startMonth: 4 }, // May 30-31
  { topic: 'Routes and network diagrams', name: 'Routes & Networks', days: 3, startDay: 1, startMonth: 5 }, // June 01-03
  { topic: 'Set theory and venn diagrams', name: 'Set Theory & Venn', days: 2, startDay: 4, startMonth: 5 }, // June 04-05
  { topic: 'Logical Reasoning Revision', name: 'Revision (Networks & Venn)', days: 2, startDay: 6, startMonth: 5 }, // June 06-07
  { topic: 'Cubes and dices', name: 'Cubes & Dices', days: 3, startDay: 8, startMonth: 5 }, // June 08-10
  { topic: 'Games and tournments', name: 'Games & Tournaments', days: 2, startDay: 11, startMonth: 5 }, // June 11-12
  { topic: 'Logical Reasoning Revision', name: 'Revision (Cubes & Games)', days: 2, startDay: 13, startMonth: 5 }, // June 13-14
  { topic: 'Puzzles on scheduling', name: 'Scheduling Puzzles', days: 3, startDay: 15, startMonth: 5 }, // June 15-17
  { topic: 'Cryptarithemetic', name: 'Cryptarithmetic', days: 2, startDay: 18, startMonth: 5 }, // June 18-19
  { topic: 'Logical Reasoning Revision', name: 'Revision (Scheduling & Crypt)', days: 2, startDay: 20, startMonth: 5 }, // June 20-21
];

const DI_PLAN = [
  { topic: 'Pie Charts', name: 'Pie Charts (DILR)', days: 3, startDay: 22, startMonth: 5 }, // June 22-24
];

const UPCOMING_EXAMS = [
  { id: 'cat', name: 'CAT 2026', date: new Date(2026, 10, 29), color: '#8B5CF6', importance: 'Critical' },
  { id: 'nmat', name: 'NMAT 2026', date: new Date(2026, 9, 10), color: '#10B981', importance: 'High' },
  { id: 'snap', name: 'SNAP 2026', date: new Date(2026, 11, 6), color: '#06B6D4', importance: 'Moderate' },
  { id: 'xat', name: 'XAT 2027', date: new Date(2027, 0, 3), color: '#06B6D4', importance: 'High' },
  { id: 'mahcet', name: 'MAH CET 2027', date: new Date(2027, 2, 9), color: '#F59E0B', importance: 'Moderate' },
];

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'analytics' | 'syllabus'>('dashboard');
  const [syllabusPhase, setSyllabusPhase] = useState<1 | 2 | 3>(1);
  const [daysLeft, setDaysLeft] = useState<number>(0);
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);
  const [syllabusSearch, setSyllabusSearch] = useState('');
  const [coverageFilter, setCoverageFilter] = useState<'all' | 'covered' | 'pending'>('all');
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>([]);
  const [clickedExam, setClickedExam] = useState<string | null>(null);
  const [resourceNotes, setResourceNotes] = useState<ResourceNote[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [modalState, setModalState] = useState<'closed' | 'setup' | 'save' | 'add_topic' | 'topic_details'>('closed');
  const [activeSection, setActiveSection] = useState('quants');
  const [activeTopics, setActiveTopics] = useState<string[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);

  const [questionsDone, setQuestionsDone] = useState('');
  const [conceptMastered, setConceptMastered] = useState(false);
  const [isPractice, setIsPractice] = useState(false);
  const [topicQuestions, setTopicQuestions] = useState<Record<string, string>>({});
  const [selectedSyllabusTopic, setSelectedSyllabusTopic] = useState<{ sectionId: string, topicName: string } | null>(null);
  const [l1Count, setL1Count] = useState('');
  const [l2Count, setL2Count] = useState('');
  const [l3Count, setL3Count] = useState('');
  const [topicShortcuts, setTopicShortcuts] = useState<TopicShortcut[]>([]);
  const [importantQuestions, setImportantQuestions] = useState<ImportantQuestion[]>([]);
  const shortcutInputRef = useRef<HTMLInputElement>(null);
  const questionInputRef = useRef<HTMLInputElement>(null);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [modalView, setModalView] = useState<'details' | 'shortcut' | 'gallery' | 'category_gallery' | 'questions_gallery' | 'category_questions_gallery'>('details');
  const [selectedShortcut, setSelectedShortcut] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [viewingTimeline, setViewingTimeline] = useState<string | null>(null);
  const [previewDate, setPreviewDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    setMounted(true);
    const today = new Date();
    const currentYear = today.getFullYear();
    
    let catTarget = new Date(currentYear, 10, 29);
    if (today > catTarget) catTarget = new Date(currentYear + 1, 10, 29);
    setDaysLeft(differenceInDays(catTarget, today));

    const loadData = async () => {
      try {
        const [sessionData, tasksData, notesData, shortcutsData, questionsData] = await Promise.all([
          getSessions(),
          getDailyTasks(),
          getResourceNotes(),
          getTopicShortcuts(),
          getImportantQuestions()
        ]);
        setSessions(sessionData);
        setDailyTasks(tasksData);
        setResourceNotes(notesData);
        setTopicShortcuts(shortcutsData);
        setImportantQuestions(questionsData);
      } catch (error) {
        console.error("Failed to load initial data", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (selectedSyllabusTopic) {
      setModalView('details');
      setSelectedShortcut(null);
    }
  }, [selectedSyllabusTopic]);

  const getRecommendedTopic = (plans: any[][]) => {
    const today = new Date();
    const currentYear = today.getFullYear();
    
    for (const plan of plans) {
      for (const task of plan) {
        const taskStart = new Date(currentYear, task.startMonth, task.startDay);
        const taskEnd = addDays(taskStart, task.days - 1);
        
        if (isSameDay(today, taskStart) || (today >= taskStart && today <= taskEnd)) {
          return task;
        }
      }
    }
    return null;
  };

  const handleShortcutUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedSyllabusTopic) return;

    const title = window.prompt("Give a title for this trick:", "");
    if (title === null) return;

    try {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        const newShortcut: TopicShortcut = {
          id: crypto.randomUUID(),
          topicName: selectedSyllabusTopic.topicName,
          title: title || 'Untitled Trick',
          imageData: base64String
        };
        await saveTopicShortcut(newShortcut);
        setTopicShortcuts(prev => [newShortcut, ...prev]);
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Failed to upload shortcut", error);
      setIsUploading(false);
    }
  };

  const handleQuestionUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedSyllabusTopic) return;

    const title = window.prompt("Give a title for this important question:", "");
    if (title === null) return;

    try {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        const newQuestion: ImportantQuestion = {
          id: crypto.randomUUID(),
          topicName: selectedSyllabusTopic.topicName,
          title: title || 'Untitled Question',
          imageData: base64String
        };
        await saveImportantQuestion(newQuestion);
        setImportantQuestions(prev => [newQuestion, ...prev]);
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Failed to upload question", error);
      setIsUploading(false);
    }
  };

  const handleDeleteQuestion = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Remove this important question?")) return;
    try {
      await deleteImportantQuestion(id);
      setImportantQuestions(prev => prev.filter(q => q.id !== id));
    } catch (error) {
      console.error("Failed to delete question", error);
    }
  };
  const handleDeleteShortcut = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Remove this shortcut?")) return;
    try {
      await deleteTopicShortcut(id);
      setTopicShortcuts(prev => prev.filter(s => s.id !== id));
    } catch (error) {
      console.error("Failed to delete shortcut", error);
    }
  };

  const getCategoryTopics = (categoryId: string) => {
    return CAT_SYLLABUS[categoryId]?.flatMap(c => c.topics) || [];
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== 'application/pdf') return;
    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      const newNote: ResourceNote = {
        id: crypto.randomUUID(),
        name: file.name,
        content: base64String
      };
      try {
        await saveResourceNote(newNote);
        setResourceNotes(prev => [...prev, newNote]);
      } catch (err) {
        alert("Failed to upload file.");
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteNote = async (id: string) => {
    try {
      await deleteResourceNote(id);
      setResourceNotes(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      alert("Failed to delete note.");
    }
  };

  useEffect(() => {
    const firstCategory = CAT_SYLLABUS[activeSection]?.[0];
    if (firstCategory && firstCategory.topics.length > 0 && activeTopics.length === 0) {
      setActiveTopics([firstCategory.topics[0]]);
    }
  }, [activeSection]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerActive) {
      interval = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerActive]);

  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartStudy = () => {
    setElapsedSeconds(0);
    setIsTimerActive(true);
    setModalState('closed');
  };

  const handleEndStudy = () => {
    setIsTimerActive(false);
    setModalState('save');
  };

  const handleToggleMission = async (missionName: string) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const existing = dailyTasks.find(t => t.date === today && t.taskName === missionName);
    const newState = !existing?.completed;
    
    try {
      // Optimistic update
      if (existing) {
        setDailyTasks(prev => prev.map(t => (t.id === existing.id ? { ...t, completed: newState } : t)));
      } else {
        const newTask: DailyTask = { id: crypto.randomUUID(), date: today, taskName: missionName, completed: newState };
        setDailyTasks(prev => [...prev, newTask]);
      }
      
      await toggleDailyTask(existing?.id || crypto.randomUUID(), today, missionName, newState);
    } catch (error) {
      console.error("Failed to toggle mission", error);
      // Revert on error
      const tasks = await getDailyTasks();
      setDailyTasks(tasks);
    }
  };

  const handleSaveSession = async (e: React.FormEvent) => {
    e.preventDefault();
    const timeSpentHours = Number((elapsedSeconds / 3600).toFixed(2));
    const newSession: StudySession = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      topic: activeSection,
      subTopics: [...activeTopics],
      timeSpent: timeSpentHours,
      questionsDone: Number(questionsDone) || 0,
      conceptMastered,
      isPractice,
      topicQuestions: Object.fromEntries(
        Object.entries(topicQuestions).map(([k, v]) => [k, Number(v) || 0])
      )
    };

    try {
      await saveSession(newSession);
      setSessions(prev => [newSession, ...prev]);
      setQuestionsDone('');
      setConceptMastered(false);
      setIsPractice(false);
      setTopicQuestions({});
      setActiveTopics([]);
      setModalState('closed');
    } catch (err) {
      alert("Failed to save session to cloud. Please check your connection.");
    }
  };
  
  const openTopicProgressModal = (sectionId: string, topicName: string) => {
    const stats = getTopicStats()[topicName] || { l1: 0, l2: 0, l3: 0, mastered: false };
    setSelectedSyllabusTopic({ sectionId, topicName });
    setL1Count(stats.l1?.toString() || '');
    setL2Count(stats.l2?.toString() || '');
    setL3Count(stats.l3?.toString() || '');
    setConceptMastered(stats.mastered || false);
    setModalState('topic_details' as any);
  };
  
  const handleSaveTopicProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSyllabusTopic) return;
    
    const { sectionId, topicName } = selectedSyllabusTopic;
    const l1 = Number(l1Count) || 0;
    const l2 = Number(l2Count) || 0;
    const l3 = Number(l3Count) || 0;
    const total = l1 + l2 + l3;
    
    const progressSession: StudySession = {
      id: `topic-progress-${topicName}-${Date.now()}`,
      date: new Date().toISOString(),
      topic: sectionId,
      subTopics: [topicName],
      timeSpent: 0,
      questionsDone: total,
      conceptMastered: conceptMastered,
      isPractice: true,
      topicQuestions: {
        [topicName]: { l1, l2, l3, mastered: conceptMastered } as any
      }
    };

    try {
      await saveSession(progressSession);
      setSessions(prev => [progressSession, ...prev]);
      setModalState('closed');
      setSelectedSyllabusTopic(null);
    } catch (err) {
      alert("Failed to save progress to cloud.");
    }
  };

  const toggleTopicCompletion = async (sectionId: string, topicName: string) => {
    openTopicProgressModal(sectionId, topicName);
  };

  const handleResetTopicProgress = async () => {
    if (!selectedSyllabusTopic) return;
    if (!confirm(`Clear all logged progress for "${selectedSyllabusTopic.topicName}"? This will remove the checkmark and reset question counts for this topic.`)) return;

    const topicToClear = selectedSyllabusTopic.topicName;
    const sectionToClear = selectedSyllabusTopic.sectionId;
    try {
      const newSessions = sessions.map(s => {
        if (s.topic !== sectionToClear) return s;
        if (s.subTopics && s.subTopics.includes(topicToClear)) {
          const filtered = s.subTopics.filter(t => t !== topicToClear);
          if (filtered.length === 0) return null;
          return { ...s, subTopics: filtered };
        }
        return s;
      }).filter(Boolean) as StudySession[];

      await resetTopicSessions(sectionToClear, topicToClear);

      setSessions(newSessions);
      setModalState('closed');
      setSelectedSyllabusTopic(null);
    } catch (err) {
      console.error("Reset error:", err);
      alert("Failed to reset progress. Please check your connection.");
    }
  };

  const handleToggleSudoku = async () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const existing = dailyTasks.find(t => t.date === today && t.taskName === 'Sudoku');
    const newCompleted = !existing?.completed;
    
    const task: DailyTask = {
      id: existing?.id || Date.now().toString(),
      date: today,
      taskName: 'Sudoku',
      completed: newCompleted
    };

    try {
      await toggleDailyTask(task.id, task.date, task.taskName, task.completed);
      setDailyTasks(prev => {
        const other = prev.filter(t => !(t.date === today && t.taskName === 'Sudoku'));
        return [...other, task];
      });
    } catch (err) {
      alert("Failed to update Sudoku status.");
    }
  };

  const isSudokuDoneToday = dailyTasks.some(t => t.date === format(new Date(), 'yyyy-MM-dd') && t.taskName === 'Sudoku' && t.completed);

  const handleClearHistory = async () => {
    if (confirm("Are you sure you want to clear ALL study history? This action cannot be undone and will delete all data from the cloud.")) {
      try {
        await clearAllSessions();
        setSessions([]);
        localStorage.removeItem('mba_study_sessions');
      } catch (err) {
        alert("Failed to clear history from cloud.");
      }
    }
  };

  const totalStudyTime = sessions.reduce((sum, s) => sum + s.timeSpent, 0);
  const totalConcepts = sessions.filter(s => s.conceptMastered).length;
  const totalQuestions = sessions.reduce((sum, s) => sum + s.questionsDone, 0);

  const calculateStreak = () => {
    if (sessions.length === 0) return 0;
    const sortedSessions = [...sessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const dates = [...new Set(sortedSessions.map(s => new Date(s.date).toDateString()))];
    let streak = 0;
    let currentDate = new Date();
    const firstDate = new Date(dates[0]);
    if (differenceInDays(currentDate, firstDate) > 1) return 0;
    for (let i = 0; i < dates.length; i++) {
      const d = new Date(dates[i]);
      if (i === 0 || differenceInDays(new Date(dates[i-1]), d) === 1) streak++;
      else break;
    }
    return streak;
  };

  const calculateSyllabusProgress = () => {
    const totalTopics = ALL_SYLLABUS_TOPICS_SET.size;
    if (totalTopics === 0) return 0;

    const uniqueTopicsCovered = new Set();
    sessions.forEach(s => {
      if (s.subTopics) {
        s.subTopics.forEach(t => {
          if (ALL_SYLLABUS_TOPICS_SET.has(t)) {
            uniqueTopicsCovered.add(t);
          }
        });
      }
    });
    return Math.min(100, Math.round((uniqueTopicsCovered.size / totalTopics) * 100));
  };

  const calculateDailyHours = () => {
    const today = new Date();
    return sessions
      .filter(s => isSameDay(new Date(s.date), today))
      .reduce((sum, s) => sum + s.timeSpent, 0);
  };

  const getPhaseInfo = () => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const phase1End = new Date(currentYear, 6, 18);
    const phase2End = addDays(phase1End, 45);
    const phase3End = new Date(currentYear, 10, 29);
    
    const phases = [
      { id: 1, name: "Phase 1: Syllabus", end: phase1End, icon: <BookOpen size={16} />, importance: 'Foundation - Critical' },
      { id: 2, name: "Phase 2: Practice", end: phase2End, icon: <Target size={16} />, importance: 'Speed & Accuracy - High' },
      { id: 3, name: "Phase 3: Mocks", end: phase3End, icon: <Flame size={16} />, importance: 'Strategy - Essential' }
    ];

    if (today <= phase1End) {
      return { id: 1, name: "Phase 1: Syllabus Coverage", targetDate: phase1End, daysLeft: differenceInDays(phase1End, today), metricName: "Topics Covered", metricValue: calculateSyllabusProgress() + "%", progress: calculateSyllabusProgress(), phases };
    } else if (today <= phase2End) {
      const phase2Sessions = sessions.filter(s => new Date(s.date) > phase1End && new Date(s.date) <= phase2End);
      const qsDone = phase2Sessions.reduce((sum, s) => sum + s.questionsDone, 0);
      const targetQs = 3000;
      const progress = Math.min(100, Math.round((qsDone / targetQs) * 100));
      return { id: 2, name: "Phase 2: Intensive Practice", targetDate: phase2End, daysLeft: Math.max(0, differenceInDays(phase2End, today)), metricName: "Questions Solved", metricValue: `${qsDone} / ${targetQs}`, progress, phases };
    } else {
      const phase3Sessions = sessions.filter(s => new Date(s.date) > phase2End);
      const mocksTaken = phase3Sessions.length;
      const targetMocks = 30;
      const progress = Math.min(100, Math.round((mocksTaken / targetMocks) * 100));
      return { id: 3, name: "Phase 3: Mock Test Marathon", targetDate: phase3End, daysLeft: Math.max(0, differenceInDays(phase3End, today)), metricName: "Mocks Taken", metricValue: `${mocksTaken} / ${targetMocks}`, progress, phases };
    }
  };

  const phaseInfo = getPhaseInfo();

  const getDaysToPhase1End = () => {
    const today = new Date();
    const target = new Date(today.getFullYear(), 6, 18);
    if (today > target) return 0;
    return differenceInDays(target, today);
  };

  const getForecast = () => {
    const today = new Date();
    const totalTopics = Object.values(CAT_SYLLABUS).reduce((acc, catList) => 
      acc + catList.reduce((sum, cat) => sum + cat.topics.length, 0), 0);
    
    const coveredTopicsSet = new Set();
    sessions.forEach(s => {
      if (s.subTopics) s.subTopics.forEach(t => coveredTopicsSet.add(t));
    });
    
    const coveredTopics = coveredTopicsSet.size;
    const remainingTopics = totalTopics - coveredTopics;
    const daysUntilPhase1End = getDaysToPhase1End();
    
    if (daysUntilPhase1End <= 0) return null;
    
    const requiredTopicsPerDay = (remainingTopics / daysUntilPhase1End).toFixed(1);
    
    const sevenDaysAgo = subDays(new Date(), 7);
    const recentTopicsSet = new Set();
    sessions.filter(s => new Date(s.date) >= sevenDaysAgo).forEach(s => {
      if (s.subTopics) s.subTopics.forEach(t => recentTopicsSet.add(t));
    });
    const recentTopics = recentTopicsSet.size;
    const currentPace = (recentTopics / 7).toFixed(1);
    
    const isOnTrack = Number(currentPace) >= Number(requiredTopicsPerDay);
    
    const isWeekend = [0, 6].includes(today.getDay());
    const dailyTargets = isWeekend 
      ? { total: 8, quants: 3, dilr: 3, verbal: 2 } 
      : { total: 4, quants: 1.5, dilr: 1.5, verbal: 1 };

    const todaySessions = sessions.filter(s => isSameDay(new Date(s.date), today));
    const todayHours = {
      total: todaySessions.reduce((sum, s) => sum + s.timeSpent, 0),
      quants: todaySessions.filter(s => s.topic === 'quants').reduce((sum, s) => sum + s.timeSpent, 0),
      dilr: todaySessions.filter(s => s.topic === 'dilr').reduce((sum, s) => sum + s.timeSpent, 0),
      verbal: todaySessions.filter(s => s.topic === 'verbal').reduce((sum, s) => sum + s.timeSpent, 0),
    };

    const metTarget = todayHours.total >= dailyTargets.total;

    return {
      remainingTopics,
      daysUntilPhase1End,
      requiredTopicsPerDay,
      currentPace,
      isOnTrack,
      dailyTargets,
      todayHours,
      metTarget,
      advice: isOnTrack 
        ? (metTarget ? "You're killing it! Pace and daily goals are perfect." : `On track for July 18, but try to hit your ${dailyTargets.total}h target today.`)
        : `Speed up! You need ~${requiredTopicsPerDay} topics daily. Try to stick to your ${dailyTargets.total}h study plan.`,
      planTask: (() => {
        const now = new Date();
        const planItem = ALGEBRA_PLAN.find(item => {
          const start = new Date(now.getFullYear(), item.startMonth, item.startDay);
          const end = addDays(start, item.days - 1);
          return now >= start && now <= end;
        });
        return planItem;
      })()
    };
  };

  const getRecommendation = () => {
    const today = previewDate ? new Date(previewDate) : new Date();
    const todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    const results: any[] = [];

    const buildRec = (planItem: any, isLR: boolean, isAlgebra: boolean, isArithmetic: boolean, isGeometry: boolean) => {
      let task = `Targeted study for ${planItem.name}. Aim for Level 1 & 2 questions.`;
      
      return {
        topic: planItem.name,
        task,
        section: isLR ? 'dilr' : 'quants',
        category: isLR ? 'LR Intensive Plan' : isAlgebra ? 'Algebra Intensive Plan' : isArithmetic ? 'Arithmetic Intensive Plan' : isGeometry ? 'Geometry Intensive Plan' : 'Modern Maths Intensive Plan',
        isWeeklyReview: false,
        actualTopic: planItem.topic
      };
    };

    let quantsItem = ALGEBRA_PLAN.find(item => {
      const start = new Date(today.getFullYear(), item.startMonth, item.startDay);
      const end = addDays(start, item.days - 1);
      return todayLocal >= start && todayLocal <= end;
    });

    if (!quantsItem) {
      quantsItem = ARITHMETIC_PLAN.find(item => {
        const start = new Date(today.getFullYear(), item.startMonth, item.startDay);
        const end = addDays(start, item.days - 1);
        return todayLocal >= start && todayLocal <= end;
      });
    }

    if (!quantsItem) {
      quantsItem = GEOMETRY_PLAN.find(item => {
        const start = new Date(today.getFullYear(), item.startMonth, item.startDay);
        const end = addDays(start, item.days - 1);
        return todayLocal >= start && todayLocal <= end;
      });
    }

    if (!quantsItem) {
      quantsItem = MODERN_MATHS_PLAN.find(item => {
        const start = new Date(today.getFullYear(), item.startMonth, item.startDay);
        const end = addDays(start, item.days - 1);
        return todayLocal >= start && todayLocal <= end;
      });
    }

    if (quantsItem) {
      const isAlgebra = ALGEBRA_PLAN.some(p => p.name === quantsItem?.name && p.startDay === quantsItem?.startDay);
      const isArithmetic = ARITHMETIC_PLAN.some(p => p.name === quantsItem?.name && p.startDay === quantsItem?.startDay);
      const isGeometry = GEOMETRY_PLAN.some(p => p.name === quantsItem?.name && p.startDay === quantsItem?.startDay);
      results.push(buildRec(quantsItem, false, isAlgebra, isArithmetic, isGeometry));
    }

    const lrItem = LR_PLAN.find(item => {
      const start = new Date(today.getFullYear(), item.startMonth, item.startDay);
      const end = addDays(start, item.days - 1);
      return todayLocal >= start && todayLocal <= end;
    });

    if (lrItem) {
      results.push(buildRec(lrItem, true, false, false, false));
    }

    if (results.length > 0) return results;

    const allPending = [];
    for (const section in CAT_SYLLABUS) {
      for (const cat of CAT_SYLLABUS[section]) {
        for (const topic of cat.topics) {
          const isDone = sessions.some(s => s.topic === section && (s.subTopics && s.subTopics.includes(topic)));
          if (!isDone) {
            allPending.push({ section, category: cat.category, topic, importance: cat.importance });
          }
        }
      }
    }
    
    const high = allPending.filter(p => p.importance === 'High');
    const picked = high.length > 0 ? high[0] : allPending[0];
    
    if (!picked) return null;

    return {
      ...picked,
      task: `Solve Arun Sharma Level 1 & 2 for ${picked.topic}.`,
      isWeeklyReview: false
    };
  };

  const recommendation = getRecommendation();
  const forecast = getForecast();

  const generateChartData = () => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = date.toDateString();
      const hours = sessions.filter(s => new Date(s.date).toDateString() === dateStr).reduce((sum, s) => sum + s.timeSpent, 0);
      data.push({ name: format(date, 'EEE'), hours: Number(hours.toFixed(1)) });
    }
    return data;
  };

  const generatePieData = () => {
    return SYLLABUS_TOPICS.map(topic => {
      const value = sessions.filter(s => s.topic === topic.id).reduce((sum, s) => sum + s.timeSpent, 0);
      return { name: topic.name, value: Number(value.toFixed(1)), color: topic.color };
    }).filter(d => d.value > 0);
  };

  const generateDetailedDailyData = () => {
    const data = [];
    for (let i = 13; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dailySessions = sessions.filter(s => isSameDay(new Date(s.date), date));
      data.push({
        name: format(date, 'MMM dd'),
        Quants: Number(dailySessions.filter(s => s.topic === 'quants').reduce((sum, s) => sum + s.timeSpent, 0).toFixed(1)),
        Verbal: Number(dailySessions.filter(s => s.topic === 'verbal').reduce((sum, s) => sum + s.timeSpent, 0).toFixed(1)),
        DILR: Number(dailySessions.filter(s => s.topic === 'dilr').reduce((sum, s) => sum + s.timeSpent, 0).toFixed(1)),
      });
    }
    return data;
  };

  const generateSyllabusProgress = () => {
    return SYLLABUS_TOPICS.map(sectionInfo => {
      const topicSessions = sessions.filter(s => s.topic === sectionInfo.id);
      const allSyllabusTopics = new Set(CAT_SYLLABUS[sectionInfo.id].flatMap(cat => cat.topics));
      const coveredTopicsSet = new Set<string>();
      
      topicSessions.forEach(s => {
        if (s.subTopics) {
          s.subTopics.forEach(t => {
            if (ALL_SYLLABUS_TOPICS_SET.has(t) && allSyllabusTopics.has(t)) {
              coveredTopicsSet.add(t);
            }
          });
        }
      });
      
      const coveredTopics = coveredTopicsSet.size;
      const totalTopicsCount = allSyllabusTopics.size;
      const progress = Math.min(100, Math.round((coveredTopics / totalTopicsCount) * 100)) || 0;
      return { ...sectionInfo, progress, coveredTopics, totalTopicsCount };
    });
  };

  const getTopicStats = () => {
    const topicMap: Record<string, { time: number, qs: number, mastered: boolean, section: string, l1: number, l2: number, l3: number }> = {};
    
    Object.entries(CAT_SYLLABUS).forEach(([section, categories]) => {
      categories.forEach(cat => {
        cat.topics.forEach(topic => {
          topicMap[topic] = { time: 0, qs: 0, mastered: false, section, l1: 0, l2: 0, l3: 0 };
        });
      });
    });

    const masteryLocked = new Set();
    sessions.forEach(s => {
      if (s.subTopics) {
        s.subTopics.forEach(topic => {
          if (topicMap[topic]) {
            topicMap[topic].time += s.timeSpent;
            const tq = s.topicQuestions?.[topic];
            if (typeof tq === 'object' && tq !== null) {
              topicMap[topic].l1 += (tq as any).l1 || 0;
              topicMap[topic].l2 += (tq as any).l2 || 0;
              topicMap[topic].l3 += (tq as any).l3 || 0;
              topicMap[topic].qs += ((tq as any).l1 || 0) + ((tq as any).l2 || 0) + ((tq as any).l3 || 0);
              if (!masteryLocked.has(topic)) {
                topicMap[topic].mastered = (tq as any).mastered || false;
                masteryLocked.add(topic);
              }
            } else {
              topicMap[topic].qs += Number(tq) || 0;
            }
          }
        });
      }
    });
    return topicMap;
  };

  const generateConsistencyBoxes = () => {
    const boxes = [];
    const sessionDates = new Set(sessions.map(s => new Date(s.date).toDateString()));
    for (let i = 59; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const isActive = sessionDates.has(date.toDateString());
      boxes.push(<div key={i} title={format(date, 'MMM dd, yyyy')} className={`${styles.consistencyBox} ${isActive ? styles.consistencyBoxActive : ''}`} />);
    }
    return boxes;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '12px', borderRadius: '8px', color: 'var(--text-main)' }}>
          <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-muted)' }}>{label}</p>
          {payload.map((p: any, i: number) => (<p key={i} style={{ margin: '4px 0 0', color: p.color || p.fill, fontWeight: 700 }}>{`${p.name}: ${p.value}h`}</p>))}
        </div>
      );
    }
    return null;
  };

  if (!mounted || loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className={styles.activeSessionPulse} style={{ width: '40px', height: '40px', margin: '0 auto 1rem', background: 'var(--accent-primary)' }}></div>
          <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Syncing with Neon Cloud...</p>
        </div>
      </div>
    );
  }

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleWrapper}>
          <h1>MBA Prep Hub</h1>
          <p>Track your journey to top B-Schools</p>
          
          <div className={styles.roadmap}>
            {phaseInfo.phases.map(p => (
              <div key={p.id} className={`${styles.roadmapStep} ${phaseInfo.id === p.id ? styles.roadmapStepActive : phaseInfo.id > p.id ? styles.roadmapStepDone : ''}`}>
                <div className={styles.roadmapIcon}>{p.icon}</div>
                <div className={styles.roadmapText}>
                  <div className={styles.roadmapName}>{p.name}</div>
                  <div className={styles.roadmapDate}>Ends {format(p.end, 'MMM dd')}</div>
                </div>
                {p.id < 3 && <div className={styles.roadmapLine} />}
              </div>
            ))}
          </div>

          <nav className={styles.tabs}>
            <button className={`${styles.tab} ${activeTab === 'dashboard' ? styles.tabActive : ''}`} onClick={() => setActiveTab('dashboard')}><LayoutDashboard size={18} /> Dashboard</button>
            <button className={`${styles.tab} ${activeTab === 'analytics' ? styles.tabActive : ''}`} onClick={() => setActiveTab('analytics')}><BarChart3 size={18} /> Analytics</button>
            <button className={`${styles.tab} ${activeTab === 'syllabus' ? styles.tabActive : ''}`} onClick={() => setActiveTab('syllabus')}><BookOpen size={18} /> Syllabus</button>
          </nav>
        </div>
        

      </header>

      {isTimerActive && (
        <div className={styles.activeSessionBanner}>
          <div className={styles.activeSessionInfo}>
            <div className={styles.activeSessionPulse}></div>
            <div>
              <strong style={{ display: 'block', fontSize: '0.9rem' }}>{isPractice ? 'PRACTICING NOW' : 'STUDYING NOW'}</strong>
              <span style={{ opacity: 0.9, fontSize: '0.8rem' }}>{activeSection.toUpperCase()} &bull; {activeTopics.join(', ')}</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <button className={styles.endSessionBtn} style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }} onClick={() => setModalState('add_topic')}>
              <Plus size={16} /> Add Topic
            </button>
            <div style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700, fontSize: '1.1rem' }}>{formatTime(elapsedSeconds)}</div>
            <button className={styles.endSessionBtn} onClick={handleEndStudy}><Square size={16} fill="currentColor" /> End Session</button>
          </div>
        </div>
      )}

      {modalState !== 'closed' && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            {modalState === 'topic_details' && modalView === 'shortcut' && selectedShortcut ? (
              <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.3s ease' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>Shortcut Preview</h2>
                  <button 
                    onClick={() => setModalView('gallery')}
                    style={{ background: 'var(--bg-main)', border: 'none', borderRadius: '50%', padding: '0.75rem', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <X size={24} />
                  </button>
                </div>
                <div style={{ flex: 1, position: 'relative', background: '#F8FAFC', borderRadius: '24px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)' }}>
                  <img 
                    src={selectedShortcut} 
                    alt="Shortcut View" 
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} 
                  />
                </div>
              </div>
             ) : modalState === 'topic_details' && modalView === 'category_gallery' ? (
              <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.3s ease' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>Complete Trick Gallery</h2>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      {selectedCategory === 'quants' ? 'Quantitative Aptitude' : selectedCategory === 'verbal' ? 'Verbal Ability' : 'DILR'} • 
                      {topicShortcuts.filter(s => getCategoryTopics(selectedCategory || '').includes(s.topicName)).length} items
                    </p>
                  </div>
                  <button 
                    onClick={() => setModalState('closed')}
                    style={{ background: 'var(--bg-main)', borderRadius: '50%', padding: '0.75rem', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)' }}
                  >
                    <X size={24} />
                  </button>
                </div>

                {/* Index Section */}
                {topicShortcuts.filter(s => getCategoryTopics(selectedCategory || '').includes(s.topicName)).length > 0 && (
                  <div style={{ background: '#F8FAFC', borderRadius: '20px', padding: '1.5rem', marginBottom: '2rem', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <List size={16} /> Trick Index
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '0.75rem' }}>
                      {topicShortcuts
                        .filter(s => getCategoryTopics(selectedCategory || '').includes(s.topicName))
                        .map((s, idx) => (
                          <button 
                            key={`index-${s.id}`}
                            onClick={() => {
                              const el = document.getElementById(`trick-${s.id}`);
                              el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }}
                            style={{ 
                              textAlign: 'left', 
                              padding: '0.6rem 1rem', 
                              background: 'white', 
                              border: '1px solid var(--border-color)', 
                              borderRadius: '10px', 
                              fontSize: '0.85rem', 
                              fontWeight: 600, 
                              color: 'var(--text-main)', 
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.75rem',
                              transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.color = 'var(--accent-primary)'; }}
                            onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-main)'; }}
                          >
                            <span style={{ opacity: 0.3, fontSize: '0.7rem' }}>{idx + 1}</span>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</span>
                          </button>
                        ))
                      }
                    </div>
                  </div>
                )}
                <div style={{ flex: 1, overflowY: 'auto', paddingRight: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }} className={styles.customScrollbar}>
                  {selectedCategory && CAT_SYLLABUS[selectedCategory].map((catGroup, groupIdx) => {
                    const groupShortcuts = topicShortcuts.filter(s => catGroup.topics.includes(s.topicName));
                    if (groupShortcuts.length === 0) return null;

                    return (
                      <div key={catGroup.category} style={{ marginBottom: '3rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', marginTop: groupIdx === 0 ? '0' : '1.5rem' }}>
                          <h3 style={{ fontSize: '1.4rem', fontWeight: 900, margin: 0, letterSpacing: '-0.02em', background: 'var(--accent-primary)', color: 'white', padding: '0.5rem 1.5rem', borderRadius: '14px', boxShadow: '0 4px 12px rgba(139, 92, 246, 0.2)' }}>
                            {catGroup.category}
                          </h3>
                          <div style={{ flex: 1, height: '2px', background: 'linear-gradient(90deg, var(--accent-primary) 0%, transparent 100%)', opacity: 0.2 }}></div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                          {groupShortcuts.map((s, idx) => (
                            <div id={`trick-${s.id}`} key={s.id} style={{ position: 'relative', borderRadius: '24px', overflow: 'hidden', border: '1px solid var(--border-color)', background: '#F8FAFC', padding: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                  <div style={{ background: 'rgba(0,0,0,0.06)', color: 'var(--text-main)', padding: '0.4rem 1rem', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 800 }}>
                                    #{idx + 1}
                                  </div>
                                  <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.01em' }}>
                                    {s.title}
                                  </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'white', padding: '0.4rem 1rem', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-primary)', border: '1px solid var(--border-color)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                                  <BookOpen size={16} />
                                  {s.topicName}
                                </div>
                              </div>
                              <img 
                                src={s.imageData} 
                                alt={`Shortcut ${idx + 1}`} 
                                style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '16px', cursor: 'pointer', boxShadow: '0 8px 25px rgba(0,0,0,0.08)' }} 
                                onClick={() => {
                                  setSelectedShortcut(s.imageData);
                                  setModalView('shortcut');
                                }}
                              />
                              <button 
                                className={styles.deleteShortcut} 
                                style={{ top: '1.5rem', right: '1.5rem', background: 'rgba(239, 68, 68, 0.9)', color: 'white', opacity: 0, transition: 'opacity 0.2s' }}
                                onMouseOver={(e) => e.currentTarget.style.opacity = '1'}
                                onMouseOut={(e) => e.currentTarget.style.opacity = '0'}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteShortcut(s.id, e);
                                }}
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}

                  {selectedCategory && topicShortcuts.filter(s => getCategoryTopics(selectedCategory).includes(s.topicName)).length === 0 && (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', color: 'var(--text-muted)', padding: '4rem 0' }}>
                      <ImageOff size={48} opacity={0.3} />
                      <p>No shortcuts uploaded for this category yet.</p>
                      <button onClick={() => setModalState('closed')} className={styles.btnPrimary} style={{ width: 'auto' }}>Return to Syllabus</button>
                    </div>
                  )}
                </div>
              </div>
            ) : modalState === 'topic_details' && modalView === 'gallery' ? (
              <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.3s ease' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>Shortcuts Gallery</h2>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>{selectedSyllabusTopic?.topicName} • {topicShortcuts.filter(s => s.topicName === selectedSyllabusTopic?.topicName).length} items</p>
                  </div>
                  <button 
                    onClick={() => setModalView('details')}
                    style={{ background: 'var(--bg-main)', borderRadius: '50%', padding: '0.75rem', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)' }}
                  >
                    <X size={24} />
                  </button>
                </div>

                {/* Topic Index Section */}
                {topicShortcuts.filter(s => s.topicName === selectedSyllabusTopic?.topicName).length > 0 && (
                  <div style={{ background: '#F8FAFC', borderRadius: '20px', padding: '1.5rem', marginBottom: '2rem', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <List size={16} /> Topic Index
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '0.75rem' }}>
                      {topicShortcuts
                        .filter(s => s.topicName === selectedSyllabusTopic?.topicName)
                        .map((s, idx) => (
                          <button 
                            key={`topic-index-${s.id}`}
                            onClick={() => {
                              const el = document.getElementById(`trick-${s.id}`);
                              el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }}
                            style={{ 
                              textAlign: 'left', 
                              padding: '0.6rem 1rem', 
                              background: 'white', 
                              border: '1px solid var(--border-color)', 
                              borderRadius: '10px', 
                              fontSize: '0.85rem', 
                              fontWeight: 600, 
                              color: 'var(--text-main)', 
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.75rem',
                              transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.color = 'var(--accent-primary)'; }}
                            onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-main)'; }}
                          >
                            <span style={{ opacity: 0.3, fontSize: '0.7rem' }}>{idx + 1}</span>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</span>
                          </button>
                        ))
                      }
                    </div>
                  </div>
                )}
                <div style={{ flex: 1, overflowY: 'auto', paddingRight: '1rem', display: 'flex', flexDirection: 'column', gap: '2rem' }} className={styles.customScrollbar}>
                  {topicShortcuts
                    .filter(s => s.topicName === selectedSyllabusTopic?.topicName)
                    .map((s, idx) => (
                      <div id={`trick-${s.id}`} key={s.id} style={{ position: 'relative', borderRadius: '24px', overflow: 'hidden', border: '1px solid var(--border-color)', background: '#F8FAFC', padding: '1rem' }}>
                        <div style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', background: 'rgba(255,255,255,0.9)', padding: '0.4rem 1rem', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 800, zIndex: 5, border: '1px solid rgba(0,0,0,0.1)' }}>
                          TRICK #{idx + 1}: {s.title}
                        </div>
                        <img 
                          src={s.imageData} 
                          alt={`Shortcut ${idx + 1}`} 
                          style={{ width: '100%', height: 'auto', borderRadius: '16px', display: 'block', cursor: 'zoom-in' }} 
                          onClick={() => {
                            setSelectedShortcut(s.imageData);
                            setModalView('shortcut');
                          }}
                        />
                        <button 
                          onClick={(e) => handleDeleteShortcut(s.id, e)}
                          style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: '#EF4444', color: 'white', border: 'none', borderRadius: '10px', padding: '0.5rem', cursor: 'pointer', zIndex: 5 }}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  {topicShortcuts.filter(s => s.topicName === selectedSyllabusTopic?.topicName).length === 0 && (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: '1rem' }}>
                      <ImageOff size={48} opacity={0.3} />
                      <p>No shortcuts uploaded for this topic yet.</p>
                      <button onClick={() => setModalView('details')} className={styles.btnPrimary} style={{ width: 'auto' }}>Go Back to Upload</button>
                    </div>
                  )}
                </div>
              </div>
            ) : modalState === 'topic_details' && modalView === 'questions_gallery' ? (
              <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.3s ease' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>Questions Gallery</h2>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>{selectedSyllabusTopic?.topicName}</p>
                  </div>
                  <button 
                    onClick={() => setModalView('details')}
                    style={{ background: 'var(--bg-main)', border: 'none', borderRadius: '50%', padding: '0.75rem', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <X size={24} />
                  </button>
                </div>

                {/* Index Section */}
                {importantQuestions.filter(q => q.topicName === selectedSyllabusTopic?.topicName).length > 0 && (
                  <div style={{ background: '#F0FDFA', borderRadius: '20px', padding: '1.5rem', marginBottom: '2rem', border: '1px solid rgba(20, 184, 166, 0.2)' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#14B8A6', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <List size={16} /> Question Index
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '0.75rem' }}>
                      {importantQuestions
                        .filter(q => q.topicName === selectedSyllabusTopic?.topicName)
                        .map((q, idx) => (
                          <button 
                            key={`index-q-${q.id}`}
                            onClick={() => {
                              const el = document.getElementById(`question-${q.id}`);
                              el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }}
                            style={{ 
                              textAlign: 'left', 
                              padding: '0.6rem 1rem', 
                              background: 'white', 
                              border: '1px solid var(--border-color)', 
                              borderRadius: '10px', 
                              fontSize: '0.85rem', 
                              fontWeight: 600, 
                              color: 'var(--text-main)', 
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.75rem',
                              transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--accent-secondary)'; e.currentTarget.style.color = 'var(--accent-secondary)'; }}
                            onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-main)'; }}
                          >
                            <span style={{ opacity: 0.3, fontSize: '0.7rem' }}>{idx + 1}</span>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.title}</span>
                          </button>
                        ))
                      }
                    </div>
                  </div>
                )}

                <div style={{ flex: 1, overflowY: 'auto', paddingRight: '1rem', display: 'flex', flexDirection: 'column', gap: '2rem' }} className={styles.customScrollbar}>
                  {importantQuestions
                    .filter(q => q.topicName === selectedSyllabusTopic?.topicName)
                    .map((q, idx) => (
                      <div id={`question-${q.id}`} key={q.id} style={{ position: 'relative', borderRadius: '24px', overflow: 'hidden', border: '1px solid var(--border-color)', background: '#F8FAFC', padding: '1rem' }}>
                        <div style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', background: 'rgba(255,255,255,0.9)', padding: '0.4rem 1rem', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 800, zIndex: 5, border: '1px solid rgba(6, 182, 212, 0.2)', color: 'var(--accent-secondary)' }}>
                          QUESTION #{idx + 1}: {q.title}
                        </div>
                        <img 
                          src={q.imageData} 
                          alt={`Question ${idx + 1}`} 
                          style={{ width: '100%', height: 'auto', borderRadius: '16px', display: 'block', cursor: 'zoom-in' }} 
                          onClick={() => {
                            setSelectedShortcut(q.imageData);
                            setModalView('shortcut');
                          }}
                        />
                        <button 
                          onClick={(e) => handleDeleteQuestion(q.id, e)}
                          style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: '#EF4444', color: 'white', border: 'none', borderRadius: '10px', padding: '0.5rem', cursor: 'pointer', zIndex: 5 }}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  {importantQuestions.filter(q => q.topicName === selectedSyllabusTopic?.topicName).length === 0 && (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: '1rem' }}>
                      <FileText size={48} opacity={0.3} />
                      <p>No important questions uploaded for this topic yet.</p>
                      <button onClick={() => setModalView('details')} className={styles.btnPrimary} style={{ width: 'auto' }}>Go Back to Upload</button>
                    </div>
                  )}
                </div>
              </div>
            ) : modalState === 'topic_details' && modalView === 'category_questions_gallery' ? (
              <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.3s ease' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>Complete Question Gallery</h2>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      {selectedCategory === 'quants' ? 'Quantitative Aptitude' : selectedCategory === 'verbal' ? 'Verbal Ability' : 'DILR'} • 
                      {importantQuestions.filter(q => getCategoryTopics(selectedCategory || '').includes(q.topicName)).length} items
                    </p>
                  </div>
                  <button 
                    onClick={() => setModalState('closed')}
                    style={{ background: 'var(--bg-main)', borderRadius: '50%', padding: '0.75rem', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)' }}
                  >
                    <X size={24} />
                  </button>
                </div>

                {/* Index Section */}
                {importantQuestions.filter(q => getCategoryTopics(selectedCategory || '').includes(q.topicName)).length > 0 && (
                  <div style={{ background: '#F0FDFA', borderRadius: '20px', padding: '1.5rem', marginBottom: '2rem', border: '1px solid rgba(20, 184, 166, 0.2)' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#14B8A6', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <List size={16} /> Question Index
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '0.75rem' }}>
                      {importantQuestions
                        .filter(q => getCategoryTopics(selectedCategory || '').includes(q.topicName))
                        .map((q, idx) => (
                          <button 
                            key={`index-q-${q.id}`}
                            onClick={() => {
                              const el = document.getElementById(`question-${q.id}`);
                              el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }}
                            style={{ 
                              textAlign: 'left', 
                              padding: '0.6rem 1rem', 
                              background: 'white', 
                              border: '1px solid var(--border-color)', 
                              borderRadius: '10px', 
                              fontSize: '0.85rem', 
                              fontWeight: 600, 
                              color: 'var(--text-main)', 
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.75rem',
                              transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--accent-secondary)'; e.currentTarget.style.color = 'var(--accent-secondary)'; }}
                            onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-main)'; }}
                          >
                            <span style={{ opacity: 0.3, fontSize: '0.7rem' }}>{idx + 1}</span>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.title}</span>
                          </button>
                        ))
                      }
                    </div>
                  </div>
                )}

                <div style={{ flex: 1, overflowY: 'auto', paddingRight: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }} className={styles.customScrollbar}>
                  {selectedCategory && CAT_SYLLABUS[selectedCategory].map((catGroup, groupIdx) => {
                    const groupQuestions = importantQuestions.filter(q => catGroup.topics.includes(q.topicName));
                    if (groupQuestions.length === 0) return null;

                    return (
                      <div key={catGroup.category} style={{ marginBottom: '3rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', marginTop: groupIdx === 0 ? '0' : '1.5rem' }}>
                          <h3 style={{ fontSize: '1.4rem', fontWeight: 900, margin: 0, letterSpacing: '-0.02em', background: 'var(--accent-secondary)', color: 'white', padding: '0.5rem 1.5rem', borderRadius: '14px', boxShadow: '0 4px 12px rgba(6, 182, 212, 0.2)' }}>
                            {catGroup.category}
                          </h3>
                          <div style={{ flex: 1, height: '2px', background: 'linear-gradient(90deg, var(--accent-secondary) 0%, transparent 100%)', opacity: 0.2 }}></div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                          {groupQuestions.map((q, idx) => (
                            <div id={`question-${q.id}`} key={q.id} style={{ position: 'relative', borderRadius: '24px', overflow: 'hidden', border: '1px solid var(--border-color)', background: '#F8FAFC', padding: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                  <div style={{ background: 'rgba(0,0,0,0.06)', color: 'var(--text-main)', padding: '0.4rem 1rem', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 800 }}>
                                    #{idx + 1}
                                  </div>
                                  <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.01em' }}>
                                    {q.title}
                                  </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'white', padding: '0.4rem 1rem', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-secondary)', border: '1px solid var(--border-color)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                                  <FileText size={16} />
                                  {q.topicName}
                                </div>
                              </div>
                              <img 
                                src={q.imageData} 
                                alt={`Question ${idx + 1}`} 
                                style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '16px', cursor: 'pointer', boxShadow: '0 8px 25px rgba(0,0,0,0.08)' }} 
                                onClick={() => {
                                  setSelectedShortcut(q.imageData);
                                  setModalView('shortcut');
                                }}
                              />
                              <button 
                                className={styles.deleteShortcut} 
                                style={{ top: '1.5rem', right: '1.5rem', background: 'rgba(239, 68, 68, 0.9)', color: 'white', opacity: 0, transition: 'opacity 0.2s' }}
                                onMouseOver={(e) => e.currentTarget.style.opacity = '1'}
                                onMouseOut={(e) => e.currentTarget.style.opacity = '0'}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteQuestion(q.id, e);
                                }}
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}

                  {selectedCategory && importantQuestions.filter(q => getCategoryTopics(selectedCategory).includes(q.topicName)).length === 0 && (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', color: 'var(--text-muted)', padding: '4rem 0' }}>
                      <FileText size={48} opacity={0.3} />
                      <p>No important questions uploaded for this category yet.</p>
                      <button onClick={() => setModalState('closed')} className={styles.btnPrimary} style={{ width: 'auto' }}>Return to Syllabus</button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className={styles.modalHeader}>
                  <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>
                    {modalState === 'setup' ? "Ignite Your Focus" : 
                     modalState === 'add_topic' ? "Expand Your Focus" : 
                     modalState === 'topic_details' ? `Progress: ${selectedSyllabusTopic?.topicName}` :
                     "Victory Lap: Session Summary"}
                  </h2>
                  <button onClick={() => setModalState('closed')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={28} /></button>
                </div>

            {modalState === 'add_topic' && (
              <div className={styles.modalBody}>
                <div style={{ padding: '2rem', background: 'var(--bg-main)', borderRadius: '24px', border: '1px solid var(--border-color)' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '1rem' }}>Active Focus</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {activeTopics.map(t => <span key={t} className={styles.topicChipDone} style={{ fontSize: '0.8rem', padding: '0.4rem 1rem', borderRadius: '8px' }}>{t}</span>)}
                  </div>
                  <p style={{ marginTop: '2rem', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    Add more topics to your current session. The timer will keep running, and all topics will be logged together.
                  </p>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div className={styles.formGroup}>
                    <label>Select Additional Topic</label>
                    <select className={styles.formSelect} value={""} onChange={e => {
                      if (e.target.value && !activeTopics.includes(e.target.value)) {
                        setActiveTopics([...activeTopics, e.target.value]);
                        setModalState('closed');
                      }
                    }}>
                      <option value="" disabled>Choose a topic...</option>
                      {CAT_SYLLABUS[activeSection]?.map(cat => (
                        <optgroup key={cat.category} label={cat.category}>
                          {cat.topics.filter(t => !activeTopics.includes(t)).map(topic => <option key={topic} value={topic}>{topic}</option>)}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                  <button className={styles.btnPrimary} onClick={() => setModalState('closed')} style={{ padding: '1.25rem', margin: 0 }}>Return to Session</button>
                </div>
              </div>
            )}

            {modalState === 'setup' && (
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label>Select Your Battleground</label>
                  <div className={styles.sectionChipGrid}>
                    {SYLLABUS_TOPICS.map(t => (
                      <div 
                        key={t.id} 
                        className={`${styles.sectionChip} ${activeSection === t.id ? styles.sectionChipActive : ''}`}
                        onClick={() => {
                          setActiveSection(t.id);
                          setActiveTopics([]);
                        }}
                      >
                        <BookOpen size={24} />
                        <span>{t.name.split(' ')[0]}</span>
                      </div>
                    ))}
                  </div>
                  
                  <label style={{ marginTop: '1.5rem' }}>Specific Chapter / Topic</label>
                  <select className={styles.formSelect} value={activeTopics[0] || ""} onChange={e => setActiveTopics([e.target.value])}>
                    <option value="" disabled>Choose a topic...</option>
                    {CAT_SYLLABUS[activeSection]?.map(cat => (
                      <optgroup key={cat.category} label={cat.category}>
                        {cat.topics.map(topic => <option key={topic} value={topic}>{topic}</option>)}
                      </optgroup>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ padding: '2rem', background: 'rgba(139, 92, 246, 0.05)', borderRadius: '20px', border: '1px solid rgba(139, 92, 246, 0.1)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent-primary)', textTransform: 'uppercase', marginBottom: '1rem' }}>Session Intensity</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'center' }}>
                      <input type="checkbox" id="practice" checked={isPractice} onChange={e => setIsPractice(e.target.checked)} style={{ width: '24px', height: '24px', cursor: 'pointer' }} />
                      <label htmlFor="practice" style={{ fontSize: '1.1rem', fontWeight: 700, cursor: 'pointer', color: 'var(--text-main)' }}>Question Practice</label>
                    </div>
                  </div>
                  
                  <button className={styles.btnPrimary} onClick={handleStartStudy} disabled={activeTopics.length === 0} style={{ padding: '1.5rem', opacity: activeTopics.length === 0 ? 0.5 : 1 }}>
                    <Play size={24} fill="currentColor" /> Start Study Session
                  </button>
                  <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>AI will track your progress and adjust your roadmap.</p>
                </div>
              </div>
            )}

            {modalState === 'save' && (
              <form onSubmit={handleSaveSession} className={styles.modalBody}>
                <div style={{ textAlign: 'center', padding: '2.5rem', background: 'var(--bg-main)', borderRadius: '24px', border: '1px solid var(--border-color)' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Focus Time Achieved</div>
                  <div style={{ fontSize: '4.5rem', fontWeight: 800, color: 'var(--accent-primary)', letterSpacing: '-3px', lineHeight: 1 }}>{formatTime(elapsedSeconds)}</div>
                  <div style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '16px', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                    <input type="checkbox" id="concept" checked={conceptMastered} onChange={e => setConceptMastered(e.target.checked)} style={{ width: '22px', height: '22px', cursor: 'pointer' }} />
                    <label htmlFor="concept" style={{ fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer', color: '#059669' }}>I've mastered this concept!</label>
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {isPractice && activeTopics.length > 1 ? (
                    activeTopics.map(topic => (
                      <div key={topic} className={styles.formGroup} style={{ marginBottom: '0' }}>
                        <label style={{ fontSize: '0.85rem' }}>Questions for {topic}</label>
                        <input 
                          className={styles.formInput} 
                          type="number" 
                          min="0" 
                          value={topicQuestions[topic] || ''} 
                          onChange={e => {
                            const val = e.target.value;
                            setTopicQuestions(prev => ({ ...prev, [topic]: val }));
                            const newTopics = { ...topicQuestions, [topic]: val };
                            const total = Object.values(newTopics).reduce((sum, v) => sum + (Number(v) || 0), 0);
                            setQuestionsDone(total.toString());
                          }} 
                          placeholder={`Questions?`} 
                        />
                      </div>
                    ))
                  ) : (
                    <div className={styles.formGroup}>
                      <label>{isPractice ? "Total Questions Solved" : "Questions Conquered"}</label>
                      <input className={styles.formInput} type="number" min="0" value={questionsDone} onChange={e => setQuestionsDone(e.target.value)} placeholder="0" />
                    </div>
                  )}
                  
                  <button type="submit" className={styles.btnSuccess} style={{ padding: '1.5rem', marginTop: 'auto' }}>
                    {isPractice ? 'Save Practice Data' : 'Log Victory'}
                  </button>
                </div>
              </form>
            )}

            {modalState === 'topic_details' && selectedSyllabusTopic && (
              <form onSubmit={handleSaveTopicProgress} className={styles.modalBody}>
                <div style={{ padding: '2rem', background: 'var(--bg-main)', borderRadius: '24px', border: '1px solid var(--border-color)' }}>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>Section Tracking: {selectedSyllabusTopic.sectionId.toUpperCase()}</p>
                  <p style={{ margin: '0.5rem 0 1.5rem', fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.5px' }}>{selectedSyllabusTopic.topicName}</p>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '16px', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                    <input type="checkbox" id="topic-mastery" checked={conceptMastered} onChange={e => setConceptMastered(e.target.checked)} style={{ width: '22px', height: '22px', cursor: 'pointer' }} />
                    <label htmlFor="topic-mastery" style={{ fontSize: '1rem', fontWeight: 700, cursor: 'pointer', color: '#059669' }}>Concept Mastered</label>
                  </div>
                  
                  <p style={{ marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    Log your practice questions to update your proficiency level. AI will recalibrate your study plan based on these numbers.
                  </p>
                  <div className={styles.twoColGrid} style={{ marginTop: '1.5rem' }}>
                    {/* Shortcuts Repository Card */}
                    <div style={{ 
                      background: 'rgba(139, 92, 246, 0.02)', 
                      border: '1px solid rgba(139, 92, 246, 0.1)', 
                      borderRadius: '20px', 
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1rem',
                      transition: 'all 0.2s ease'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--accent-primary)' }}>
                          <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '0.5rem', borderRadius: '10px' }}>
                            <Image size={18} />
                          </div>
                          <span style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tricks</span>
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', background: 'white', padding: '0.2rem 0.6rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                          {topicShortcuts.filter(s => s.topicName === selectedSyllabusTopic.topicName).length}
                        </span>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          type="button"
                          onClick={() => setModalView('gallery')}
                          className={styles.btnSecondary}
                          style={{ flex: 2, padding: '0.6rem', fontSize: '0.8rem', margin: 0, background: 'white', border: '1px solid var(--border-color)', borderRadius: '12px' }}
                        >
                          View Gallery
                        </button>
                        <button 
                          type="button"
                          onClick={() => shortcutInputRef.current?.click()}
                          className={styles.btnSecondary}
                          style={{ flex: 1, padding: '0.6rem', fontSize: '0.8rem', margin: 0, background: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Plus size={18} />
                        </button>
                        <input type="file" ref={shortcutInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleShortcutUpload} />
                      </div>
                    </div>

                    {/* Questions Repository Card */}
                    <div style={{ 
                      background: 'rgba(20, 184, 166, 0.02)', 
                      border: '1px solid rgba(20, 184, 166, 0.1)', 
                      borderRadius: '20px', 
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1rem',
                      transition: 'all 0.2s ease'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#14B8A6' }}>
                          <div style={{ background: 'rgba(20, 184, 166, 0.1)', padding: '0.5rem', borderRadius: '10px' }}>
                            <FileText size={18} />
                          </div>
                          <span style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Questions</span>
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', background: 'white', padding: '0.2rem 0.6rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                          {importantQuestions.filter(q => q.topicName === selectedSyllabusTopic.topicName).length}
                        </span>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          type="button"
                          onClick={() => setModalView('questions_gallery')}
                          className={styles.btnSecondary}
                          style={{ flex: 2, padding: '0.6rem', fontSize: '0.8rem', margin: 0, background: 'white', border: '1px solid var(--border-color)', borderRadius: '12px' }}
                        >
                          View Gallery
                        </button>
                        <button 
                          type="button"
                          onClick={() => questionInputRef.current?.click()}
                          className={styles.btnSecondary}
                          style={{ flex: 1, padding: '0.6rem', fontSize: '0.8rem', margin: 0, background: '#14B8A6', color: 'white', border: 'none', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Plus size={18} />
                        </button>
                        <input type="file" ref={questionInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleQuestionUpload} />
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div className={styles.inputsGrid}>
                    <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: '0.7rem' }}>LEVEL 1</label>
                      <input className={styles.formInput} type="number" min="0" value={l1Count} onChange={e => setL1Count(e.target.value)} placeholder="0" />
                    </div>
                    <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: '0.7rem' }}>LEVEL 2</label>
                      <input className={styles.formInput} type="number" min="0" value={l2Count} onChange={e => setL2Count(e.target.value)} placeholder="0" />
                    </div>
                    <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: '0.7rem' }}>LEVEL 3</label>
                      <input className={styles.formInput} type="number" min="0" value={l3Count} onChange={e => setL3Count(e.target.value)} placeholder="0" />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', marginTop: 'auto', paddingTop: '1rem' }}>
                    <button type="submit" className={styles.btnPrimary} style={{ flex: 2, margin: 0 }}>
                      Save Progress
                    </button>
                    <button type="button" onClick={handleResetTopicProgress} style={{ flex: 1, background: 'rgba(239, 68, 68, 0.05)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '14px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>
                      Reset
                    </button>
                  </div>
                </div>
              </form>
            )}
          </>
        )}
          </div>
        </div>
      )}

      {activeTab === 'dashboard' && (
        <>


          <div style={{ marginBottom: '2.5rem' }}>
            <div className={styles.largeCardsGrid}>
              {/* Primary: Phase Progress */}
              <div className={`${styles.largeCard} ${styles.largeCardPrimary}`}>
                <div style={{ position: 'relative', zIndex: 2 }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '0.75rem' }}>CURRENT STATUS</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                      <div style={{ fontSize: '2.75rem', fontWeight: 900, letterSpacing: '-1px' }}>PHASE {syllabusPhase}</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600, opacity: 0.9, marginTop: '0.25rem' }}>Foundation & Critical Topics</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '3.5rem', fontWeight: 900, lineHeight: 1 }}>66</div>
                      <div style={{ fontSize: '0.7rem', fontWeight: 800, opacity: 0.8, textTransform: 'uppercase' }}>Days Remaining</div>
                    </div>
                  </div>
                </div>
                <div style={{ position: 'absolute', right: '-10%', top: '-10%', opacity: 0.1 }}>
                  <TrendingUp size={160} />
                </div>
              </div>

              {/* Primary: CAT Countdown */}
              {(() => {
                const catExam = UPCOMING_EXAMS[0];
                const dLeft = differenceInDays(catExam.date, new Date());
                return (
                  <div className={`${styles.largeCard} ${styles.largeCardSecondary}`}>
                    <div style={{ position: 'relative', zIndex: 2 }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '0.75rem' }}>{catExam.name} COUNTDOWN</div>
                      <div className={styles.countdownFlex}>
                        <div>
                          <div className={styles.countdownLabel}>CRITICAL</div>
                          <div className={styles.countdownSubtext}>Target: 99.5+ Percentile</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div className={styles.countdownValue}>{dLeft}</div>
                          <div className={styles.countdownValueSub}>Days Left</div>
                        </div>
                      </div>
                    </div>
                    <div style={{ position: 'absolute', right: '5%', bottom: '-10%', color: 'var(--accent-primary)', opacity: 0.03 }}>
                      <Target size={120} />
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Secondary Exams Row */}
            <div className={styles.smallCardsGrid}>
              {UPCOMING_EXAMS.slice(1).map(exam => {
                const dLeft = differenceInDays(exam.date, new Date());
                return (
                  <div key={exam.id} style={{ background: 'white', padding: '1.5rem', borderRadius: '20px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.5rem', transition: 'transform 0.2s', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{exam.name.split(' ')[0]}</span>
                      <span style={{ fontSize: '0.6rem', fontWeight: 900, color: exam.color, padding: '2px 8px', background: `${exam.color}10`, borderRadius: '10px' }}>{exam.importance}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                      <span style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-main)' }}>{dLeft < 0 ? 'Done' : dLeft}</span>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)' }}>days</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className={styles.dashboardGrid}>
            <div className={styles.dashboardMainCol}>
              <div className={styles.missionCard} style={{ padding: 0, overflow: 'hidden' }}>
                <div className={styles.missionHeader} style={{ borderBottom: '1px solid var(--border-color)', padding: '1.25rem 1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ background: 'var(--accent-primary)', color: 'white', padding: '0.4rem', borderRadius: '8px', display: 'flex' }}>
                      <Target size={18} />
                    </div>
                    <span style={{ fontWeight: 800, fontSize: '0.85rem', letterSpacing: '0.5px' }}>DAILY STUDY MISSIONS</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10B981', background: 'rgba(16, 185, 129, 0.1)', padding: '0.4rem 0.75rem', borderRadius: '20px' }}>
                    AI GENERATED
                  </div>
                </div>

                <div className={styles.missionsGrid}>
                  {/* Quants Mission */}
                  {(() => {
                    const quantsPlans = [ALGEBRA_PLAN, ARITHMETIC_PLAN, GEOMETRY_PLAN, MODERN_MATHS_PLAN];
                    const recommended = getRecommendedTopic(quantsPlans);
                    const isDone = dailyTasks.some(t => t.date === format(new Date(), 'yyyy-MM-dd') && t.taskName === 'quants_mission' && t.completed);
                    
                    // Calculate Day X of Y
                    let dayInfo = '';
                    if (recommended) {
                      const today = new Date();
                      const taskStart = new Date(today.getFullYear(), recommended.startMonth, recommended.startDay);
                      const dayOfTask = differenceInDays(today, taskStart) + 1;
                      dayInfo = `Day ${dayOfTask} of ${recommended.days}`;
                    }

                    return (
                      <div className={styles.missionItem} style={{ opacity: isDone ? 0.6 : 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-primary)' }}></div>
                            <span style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--accent-primary)', textTransform: 'uppercase' }}>Quantitative Aptitude</span>
                          </div>
                          <button 
                            onClick={() => handleToggleMission('quants_mission')}
                            style={{ 
                              background: isDone ? '#10B981' : 'rgba(0,0,0,0.04)',
                              border: `1px solid ${isDone ? '#10B981' : 'var(--border-color)'}`,
                              color: isDone ? 'white' : 'var(--text-muted)',
                              borderRadius: '8px',
                              width: '32px',
                              height: '32px',
                              padding: '0',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                              boxShadow: isDone ? '0 0 15px rgba(16, 185, 129, 0.3)' : 'none'
                            }}
                          >
                            {isDone && <Check size={16} strokeWidth={4} />}
                          </button>
                        </div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--text-main)', textDecoration: isDone ? 'line-through' : 'none' }}>
                          {recommended ? recommended.name : 'Focus on Arithmetic'}
                        </h3>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '1rem', overflowWrap: 'break-word', wordBreak: 'break-word' }}>
                          {recommended ? `Category: ${recommended.topic}` : 'Review mixed arithmetic problems to build speed.'}
                        </p>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                          <div className={styles.topicChip} style={{ padding: '2px 8px', fontSize: '0.7rem', width: 'max-content' }}><Clock size={12} /> {recommended?.days ? `${recommended.days * 2}h Total` : '2h Target'}</div>
                          {dayInfo && <div className={styles.topicChip} style={{ padding: '2px 8px', fontSize: '0.7rem', color: 'var(--accent-primary)', borderColor: 'var(--accent-primary)', background: 'rgba(139, 92, 246, 0.05)', width: 'max-content' }}>{dayInfo}</div>}
                        </div>
                      </div>
                    );
                  })()}

                  {/* LRDI Mission */}
                  {(() => {
                    const lrdiPlans = [LR_PLAN, DI_PLAN];
                    const recommended = getRecommendedTopic(lrdiPlans);
                    const isDone = dailyTasks.some(t => t.date === format(new Date(), 'yyyy-MM-dd') && t.taskName === 'lrdi_mission' && t.completed);
                    
                    // Calculate Day X of Y
                    let dayInfo = '';
                    if (recommended) {
                      const today = new Date();
                      const taskStart = new Date(today.getFullYear(), recommended.startMonth, recommended.startDay);
                      const dayOfTask = differenceInDays(today, taskStart) + 1;
                      dayInfo = `Day ${dayOfTask} of ${recommended.days}`;
                    }

                    return (
                      <div className={styles.missionItem} style={{ opacity: isDone ? 0.6 : 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#14B8A6' }}></div>
                            <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#14B8A6', textTransform: 'uppercase' }}>LRDI Strategy</span>
                          </div>
                          <button 
                            onClick={() => handleToggleMission('lrdi_mission')}
                            style={{ 
                              background: isDone ? '#10B981' : 'rgba(0,0,0,0.04)',
                              border: `1px solid ${isDone ? '#10B981' : 'var(--border-color)'}`,
                              color: isDone ? 'white' : 'var(--text-muted)',
                              borderRadius: '8px',
                              width: '32px',
                              height: '32px',
                              padding: '0',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                              boxShadow: isDone ? '0 0 15px rgba(16, 185, 129, 0.3)' : 'none'
                            }}
                          >
                            {isDone && <Check size={16} strokeWidth={4} />}
                          </button>
                        </div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--text-main)', textDecoration: isDone ? 'line-through' : 'none' }}>
                          {recommended ? recommended.name : 'LR Fundamentals'}
                        </h3>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '1rem', overflowWrap: 'break-word', wordBreak: 'break-word' }}>
                          {recommended ? `Category: ${recommended.topic}` : 'Solve 3 sets of intermediate DILR puzzles.'}
                        </p>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                          <div className={styles.topicChip} style={{ padding: '2px 8px', fontSize: '0.7rem', width: 'max-content' }}><Clock size={12} /> {recommended?.days ? `${Math.round(recommended.days * 1.5)}h Total` : '1.5h Target'}</div>
                          {dayInfo && <div className={styles.topicChip} style={{ padding: '2px 8px', fontSize: '0.7rem', color: '#14B8A6', borderColor: '#14B8A6', background: 'rgba(20, 184, 166, 0.05)', width: 'max-content' }}>{dayInfo}</div>}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Newspaper Mission */}
                  {(() => {
                    const isDone = dailyTasks.some(t => t.date === format(new Date(), 'yyyy-MM-dd') && t.taskName === 'newspaper_mission' && t.completed);
                    
                    return (
                      <div className={styles.missionItem} style={{ opacity: isDone ? 0.6 : 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#F59E0B' }}></div>
                            <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#F59E0B', textTransform: 'uppercase' }}>Daily Reading</span>
                          </div>
                          <button 
                            onClick={() => handleToggleMission('newspaper_mission')}
                            style={{ 
                              background: isDone ? '#10B981' : 'rgba(0,0,0,0.04)',
                              border: `1px solid ${isDone ? '#10B981' : 'var(--border-color)'}`,
                              color: isDone ? 'white' : 'var(--text-muted)',
                              borderRadius: '8px',
                              width: '32px',
                              height: '32px',
                              padding: '0',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                              boxShadow: isDone ? '0 0 15px rgba(16, 185, 129, 0.3)' : 'none'
                            }}
                          >
                            {isDone && <Check size={16} strokeWidth={4} />}
                          </button>
                        </div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--text-main)', textDecoration: isDone ? 'line-through' : 'none' }}>
                          Newspaper Reading
                        </h3>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '1rem', overflowWrap: 'break-word', wordBreak: 'break-word' }}>
                          Read 2 Editorials from The Hindu or Indian Express. Focus on summarizing the main argument.
                        </p>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                          <div className={styles.topicChip} style={{ padding: '2px 8px', fontSize: '0.7rem', width: 'max-content' }}><Clock size={12} /> 45m Target</div>
                          <div className={styles.topicChip} style={{ borderColor: '#F59E0B', color: '#F59E0B', background: 'rgba(245, 158, 11, 0.05)', padding: '2px 8px', fontSize: '0.7rem', width: 'max-content' }}>VARC Prep</div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Sudoku Mission */}
                  <div className={styles.missionItem} style={{ opacity: isSudokuDoneToday ? 0.6 : 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444' }}></div>
                        <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#EF4444', textTransform: 'uppercase' }}>Mental Warmup</span>
                      </div>
                      <button 
                        onClick={handleToggleSudoku}
                        style={{ 
                          background: isSudokuDoneToday ? '#10B981' : 'rgba(0,0,0,0.04)',
                          border: `1px solid ${isSudokuDoneToday ? '#10B981' : 'var(--border-color)'}`,
                          color: isSudokuDoneToday ? 'white' : 'var(--text-muted)',
                          borderRadius: '8px',
                          width: '32px',
                          height: '32px',
                          padding: '0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                          boxShadow: isSudokuDoneToday ? '0 0 15px rgba(16, 185, 129, 0.3)' : 'none'
                        }}
                      >
                        {isSudokuDoneToday && <Check size={16} strokeWidth={4} />}
                      </button>
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--text-main)', textDecoration: isSudokuDoneToday ? 'line-through' : 'none' }}>
                      Sudoku Challenge
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '1rem', overflowWrap: 'break-word', wordBreak: 'break-word' }}>
                      Sharpen your logic and pattern recognition for DILR. Play one medium or hard Sudoku.
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                      <div className={styles.topicChip} style={{ padding: '2px 8px', fontSize: '0.7rem', width: 'max-content' }}><Clock size={12} /> 15m Target</div>
                      <div className={styles.topicChip} style={{ borderColor: '#EF4444', color: '#EF4444', background: 'rgba(239, 68, 68, 0.05)', padding: '2px 8px', fontSize: '0.7rem', width: 'max-content' }}>Logic</div>
                    </div>
                  </div>
                </div>
                <div style={{ padding: '1.25rem 1.5rem', background: '#F8FAFC', borderTop: '1px solid var(--border-color)' }}>
                  <button className={styles.missionStartBtn} onClick={() => setModalState('setup')} style={{ width: '100%', margin: 0, padding: '1rem', fontSize: '1rem' }}>
                    <Play size={20} fill="currentColor" /> Start Today's Focus
                  </button>
                </div>
              </div>

              <section className={styles.section}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h2 className={styles.sectionTitle} style={{ marginBottom: 0 }}><FileText size={24} color="#8B5CF6" /> Formula Vault</h2>
                  <button 
                    className={styles.uploadBtn}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    <FileUp size={18} />
                    {isUploading ? 'Uploading...' : 'Upload PDF'}
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    accept="application/pdf" 
                    style={{ display: 'none' }} 
                  />
                </div>
                
                <div className={styles.notesGrid}>
                  {resourceNotes.length === 0 ? (
                    <div className={styles.emptyNotes}>
                      No formula sheets uploaded yet. Upload your handwritten notes to access them anywhere.
                    </div>
                  ) : (
                    resourceNotes.map(note => (
                      <div key={note.id} className={styles.noteCard}>
                        <div className={styles.noteInfo}>
                          <div className={styles.noteIcon}>
                            <FileText size={20} />
                          </div>
                          <div className={styles.noteName} title={note.name}>{note.name}</div>
                        </div>
                        <div className={styles.noteActions}>
                          <a 
                            href={note.content} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className={styles.noteActionBtn}
                            title="View PDF"
                          >
                            <ExternalLink size={16} />
                          </a>
                          <button 
                            className={`${styles.noteActionBtn} ${styles.noteDeleteBtn}`}
                            onClick={() => {
                              if (confirm("Delete this formula sheet?")) handleDeleteNote(note.id);
                            }}
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>
            
            <div className={styles.dashboardSideCol}>

              <section className={styles.section}>
                <h2 className={styles.sectionTitle}><Info size={24} color="#06B6D4" /> Exam Pattern Ref</h2>
                <div style={{ padding: '1.5rem', background: 'var(--bg-main)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                  <table className={styles.patternTable}>
                    <thead>
                      <tr>
                        <th>Section</th>
                        <th>Questions</th>
                        <th>Marking (MCQ)</th>
                        <th>Marking (TITA)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>VARC</td>
                        <td>24 Qs</td>
                        <td><span className={`${styles.markingBadge} ${styles.markingPos}`}>+3</span> <span className={`${styles.markingBadge} ${styles.markingNeg}`}>-1</span></td>
                        <td><span className={`${styles.markingBadge} ${styles.markingPos}`}>+3</span> <span className={`${styles.markingBadge} ${styles.markingNeg}`} style={{ background: 'rgba(0,0,0,0.05)', color: 'var(--text-muted)' }}>0</span></td>
                      </tr>
                      <tr>
                        <td>DILR</td>
                        <td>22 Qs</td>
                        <td><span className={`${styles.markingBadge} ${styles.markingPos}`}>+3</span> <span className={`${styles.markingBadge} ${styles.markingNeg}`}>-1</span></td>
                        <td><span className={`${styles.markingBadge} ${styles.markingPos}`}>+3</span> <span className={`${styles.markingBadge} ${styles.markingNeg}`} style={{ background: 'rgba(0,0,0,0.05)', color: 'var(--text-muted)' }}>0</span></td>
                      </tr>
                      <tr>
                        <td>Quants</td>
                        <td>22 Qs</td>
                        <td><span className={`${styles.markingBadge} ${styles.markingPos}`}>+3</span> <span className={`${styles.markingBadge} ${styles.markingNeg}`}>-1</span></td>
                        <td><span className={`${styles.markingBadge} ${styles.markingPos}`}>+3</span> <span className={`${styles.markingBadge} ${styles.markingNeg}`} style={{ background: 'rgba(0,0,0,0.05)', color: 'var(--text-muted)' }}>0</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          </div>
        </>
      )}

      {activeTab === 'analytics' && (
        <div className={styles.analyticsView}>
          <div className={styles.grid}>
            <div className={`${styles.card} ${styles.cardPrimary}`}><div className={styles.cardHeader}><span className={styles.cardTitle}>Total Study Time</span><div className={`${styles.cardIcon} ${styles.cardIconPrimary}`}><Clock size={20} /></div></div><div className={styles.cardValue}>{totalStudyTime.toFixed(1)}h</div><div className={styles.cardSubtext}>Lifetime hours logged</div></div>
            <div className={`${styles.card} ${styles.cardSecondary}`}><div className={styles.cardHeader}><span className={styles.cardTitle}>Concepts Mastered</span><div className={`${styles.cardIcon} ${styles.cardIconSecondary}`}><BookOpen size={20} /></div></div><div className={styles.cardValue}>{totalConcepts}</div><div className={styles.cardSubtext}>Key topics understood</div></div>
            <div className={`${styles.card} ${styles.cardTertiary}`}><div className={styles.cardHeader}><span className={styles.cardTitle}>Practice Qs Done</span><div className={`${styles.cardIcon} ${styles.cardIconTertiary}`}><Target size={20} /></div></div><div className={styles.cardValue}>{totalQuestions}</div><div className={styles.cardSubtext}>Problems solved</div></div>
            <div className={`${styles.card} ${styles.cardSuccess}`}><div className={styles.cardHeader}><span className={styles.cardTitle}>{phaseInfo.metricName}</span><div className={`${styles.cardIcon} ${styles.cardIconSuccess}`}><Target size={20} /></div></div><div className={styles.cardValue}>{phaseInfo.metricValue}</div><div className={styles.cardSubtext}>{phaseInfo.name}</div></div>
            <div className={`${styles.card} ${styles.cardSuccess}`} style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)' }}><div className={styles.cardHeader}><span className={styles.cardTitle}>Current Streak</span><div className={`${styles.cardIcon} ${styles.cardIconSuccess}`}><Flame size={20} /></div></div><div className={styles.cardValue}>{calculateStreak()} Days</div><div className={styles.cardSubtext}>Keep going!</div></div>
          </div>
          <div className={styles.analyticsGrid}>
            <div className={styles.analyticsCard}>
              <h2 className={styles.sectionTitle}><BarChart3 size={24} color="#8B5CF6" /> Study Consistency (Last 7 Days)</h2>
              <div className={styles.chartContainer}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={generateChartData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/><stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                    <XAxis dataKey="name" stroke="#9CA3AF" tick={{fill: '#9CA3AF'}} tickLine={false} axisLine={false} />
                    <YAxis stroke="#9CA3AF" tick={{fill: '#9CA3AF'}} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="hours" stroke="#8B5CF6" strokeWidth={3} fillOpacity={1} fill="url(#colorHours)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className={styles.analyticsCard}>
              <h2 className={styles.sectionTitle}><CheckCircle2 size={24} color="#10B981" /> 60-Day Activity Log</h2>
              <div className={styles.consistencyGrid}>{generateConsistencyBoxes()}</div>
            </div>
            
            <div className={styles.analyticsCard}><h2 className={styles.sectionTitle}><BarChart3 size={24} color="#8B5CF6" /> Sectional Breakdown</h2><div style={{ height: '300px', width: '100%' }}><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={generatePieData()} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">{generatePieData().map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}</Pie><Tooltip content={<CustomTooltip />} /><Legend verticalAlign="bottom" height={36}/></PieChart></ResponsiveContainer></div></div>
            <div className={styles.analyticsCard}><h2 className={styles.sectionTitle}><TrendingUp size={24} color="#10B981" /> Daily Progress (14 Days)</h2><div style={{ height: '300px', width: '100%' }}><ResponsiveContainer width="100%" height="100%"><BarChart data={generateDetailedDailyData()}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" /><XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} /><YAxis axisLine={false} tickLine={false} /><Tooltip content={<CustomTooltip />} /><Legend /><Bar dataKey="Quants" stackId="a" fill="#8B5CF6" /><Bar dataKey="Verbal" stackId="a" fill="#10B981" /><Bar dataKey="DILR" stackId="a" fill="#06B6D4" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div></div>
            <div className={styles.analyticsCard}>
              <h2 className={styles.sectionTitle}><TrendingUp size={24} color="#8B5CF6" /> Sudoku Consistency (30 Days)</h2>
              <div className={styles.sudokuConsistencyGrid}>
                {Array.from({ length: 30 }).map((_, i) => {
                  const d = subDays(new Date(), 29 - i);
                  const dateStr = format(d, 'yyyy-MM-dd');
                  const isDone = dailyTasks.some(t => t.date === dateStr && t.taskName === 'Sudoku' && t.completed);
                  return (
                    <div 
                      key={dateStr} 
                      title={format(d, 'MMM dd, yyyy')}
                      style={{ 
                        width: '18px', 
                        height: '18px', 
                        borderRadius: '4px', 
                        background: isDone ? '#8B5CF6' : 'rgba(0,0,0,0.05)',
                        border: '1px solid rgba(0,0,0,0.05)',
                        transition: 'all 0.2s'
                      }} 
                    />
                  );
                })}
              </div>
              <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Sudoku improves your logic and number-crunching speed, which is vital for the DILR and Quants sections.</p>
            </div>

            <div className={styles.analyticsCard}>
              <h2 className={styles.sectionTitle}><CheckCircle2 size={24} color="#10B981" /> Study Missions Consistency (30 Days)</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--accent-primary)', textTransform: 'uppercase' }}>Quants Missions</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>{dailyTasks.filter(t => t.taskName === 'quants_mission' && t.completed).length} Completed</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {Array.from({ length: 30 }).map((_, i) => {
                      const d = subDays(new Date(), 29 - i);
                      const dateStr = format(d, 'yyyy-MM-dd');
                      const isDone = dailyTasks.some(t => t.date === dateStr && t.taskName === 'quants_mission' && t.completed);
                      return (
                        <div key={i} title={format(d, 'MMM dd')} style={{ width: '18px', height: '18px', borderRadius: '4px', background: isDone ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.02)' }} />
                      );
                    })}
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#14B8A6', textTransform: 'uppercase' }}>LRDI Missions</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>{dailyTasks.filter(t => t.taskName === 'lrdi_mission' && t.completed).length} Completed</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {Array.from({ length: 30 }).map((_, i) => {
                      const d = subDays(new Date(), 29 - i);
                      const dateStr = format(d, 'yyyy-MM-dd');
                      const isDone = dailyTasks.some(t => t.date === dateStr && t.taskName === 'lrdi_mission' && t.completed);
                      return (
                        <div key={i} title={format(d, 'MMM dd')} style={{ width: '18px', height: '18px', borderRadius: '4px', background: isDone ? '#14B8A6' : 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.02)' }} />
                      );
                    })}
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#F59E0B', textTransform: 'uppercase' }}>Newspaper Reading</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>{dailyTasks.filter(t => t.taskName === 'newspaper_mission' && t.completed).length} Completed</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {Array.from({ length: 30 }).map((_, i) => {
                      const d = subDays(new Date(), 29 - i);
                      const dateStr = format(d, 'yyyy-MM-dd');
                      const isDone = dailyTasks.some(t => t.date === dateStr && t.taskName === 'newspaper_mission' && t.completed);
                      return (
                        <div key={i} title={format(d, 'MMM dd')} style={{ width: '18px', height: '18px', borderRadius: '4px', background: isDone ? '#F59E0B' : 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.02)' }} />
                      );
                    })}
                  </div>
                </div>
              </div>
              <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Daily missions are designed to build sectional consistency. Tracking your streaks helps maintain momentum.</p>
            </div>

            <div className={styles.analyticsCard} style={{ gridColumn: '1 / -1', marginTop: '1rem' }}>
              <h2 className={styles.sectionTitle}><BookOpen size={24} color="#8B5CF6" /> Topic-wise Progress Tracking</h2>
              <div style={{ overflowX: 'auto', marginTop: '1.5rem' }}>
                <table className={styles.historyTable}>
                  <thead>
                    <tr>
                      <th>Topic</th>
                      <th>Section</th>
                      <th>Study Time</th>
                      <th>Level Breakdown</th>
                      <th>Total Qs</th>
                      <th>Progress Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(getTopicStats()).sort((a, b) => b[1].qs - a[1].qs).map(([topic, stats]) => (
                      <tr key={topic} style={{ opacity: stats.qs > 0 || stats.time > 0 ? 1 : 0.6 }}>
                        <td style={{ fontWeight: 700 }}>{topic}</td>
                        <td>
                          <span className={`${styles.sessionBadge} ${stats.section === 'quants' ? styles.badgeQuants : stats.section === 'verbal' ? styles.badgeVerbal : styles.badgeDILR}`}>
                            {stats.section.toUpperCase()}
                          </span>
                        </td>
                        <td>{stats.time.toFixed(1)}h</td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 600 }}>
                            <span title="Level 1" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', padding: '2px 6px', borderRadius: '4px' }}>L1: {stats.l1}</span>
                            <span title="Level 2" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', padding: '2px 6px', borderRadius: '4px' }}>L2: {stats.l2}</span>
                            <span title="Level 3" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', padding: '2px 6px', borderRadius: '4px' }}>L3: {stats.l3}</span>
                          </div>
                        </td>
                        <td style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>{stats.qs} Qs</td>
                        <td>
                          {stats.mastered ? (
                            <span style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 700 }}>
                              <CheckCircle2 size={16} /> MASTERED
                            </span>
                          ) : stats.qs > 0 ? (
                            <span style={{ color: '#F59E0B', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 700 }}>
                              <TrendingUp size={16} /> IN PRACTICE
                            </span>
                          ) : (
                            <span style={{ color: '#94A3B8', fontSize: '0.8rem' }}>NOT STARTED</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <section className={styles.section} style={{ marginTop: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 className={styles.sectionTitle}><History size={24} color="#64748B" /> Recent Session History</h2>
              <button onClick={handleClearHistory} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>
                Clear All History
              </button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className={styles.historyTable}>
                <thead><tr><th>Date</th><th>Section</th><th>Type</th><th>Time Spent</th><th>Questions</th><th>Mastery</th></tr></thead>
                <tbody>{sessions.length > 0 ? sessions.map((session) => (<tr key={session.id}><td><div className={styles.sessionDate}>{format(new Date(session.date), 'MMM dd, yyyy')}</div><div style={{ fontSize: '0.7rem', color: '#9CA3AF' }}>{format(new Date(session.date), 'hh:mm a')}</div></td><td><span className={`${styles.sessionBadge} ${session.topic === 'quants' ? styles.badgeQuants : session.topic === 'verbal' ? styles.badgeVerbal : session.topic === 'dilr' ? styles.badgeDILR : ''}`}>{session.topic.toUpperCase()}</span></td><td>{session.isPractice ? <span style={{ color: 'var(--accent-primary)', fontSize: '0.7rem', fontWeight: 700, background: 'rgba(139, 92, 246, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>PRACTICE</span> : <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', border: '1px solid var(--border-color)', padding: '2px 6px', borderRadius: '4px' }}>LEARNING</span>}</td><td style={{ fontWeight: 600 }}>{session.timeSpent.toFixed(2)}h</td><td>{session.questionsDone} Qs</td><td>{session.conceptMastered ? (<span style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 600 }}><CheckCircle2 size={14} /> Mastered</span>) : '-'}</td></tr>)) : (<tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No sessions logged yet. Start studying to see your history!</td></tr>)}</tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {activeTab === 'syllabus' && (
        <div className={styles.syllabusView}>
          <div className={styles.phaseTabs}>
            {[1, 2, 3].map(p => (
              <button key={p} className={`${styles.phaseTab} ${syllabusPhase === p ? styles.phaseTabActive : ''}`} onClick={() => setSyllabusPhase(p as 1|2|3)}>
                Phase {p}: {p === 1 ? 'Syllabus' : p === 2 ? 'Practice' : 'Mocks'}
              </button>
            ))}
          </div>

          <div className={styles.masterTimelineCard}>
            <div className={styles.timelineHeader}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>Complete Preparation Roadmap</h2>
              <div className={styles.timelineLegend}>
                <div className={styles.legendItem}><div className={`${styles.sectionColorDot}`} style={{ backgroundColor: 'var(--accent-primary)' }} /> Phase 1</div>
                <div className={styles.legendItem}><div className={`${styles.sectionColorDot}`} style={{ backgroundColor: 'var(--accent-secondary)' }} /> Phase 2</div>
                <div className={styles.legendItem}><div className={`${styles.sectionColorDot}`} style={{ backgroundColor: 'var(--accent-tertiary)' }} /> Phase 3</div>
              </div>
            </div>

            <div className={styles.timelineTracks}>
              <div className={styles.timelineTrackRow}>
                <div className={styles.trackLabel}>TIMELINE</div>
                <div className={styles.trackCells}>
                  <div className={`${styles.trackPhase} ${syllabusPhase === 1 ? styles.trackPhaseActive : ''}`} style={{ flex: 72, background: 'rgba(139, 92, 246, 0.1)', color: 'var(--accent-primary)', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                    <span>P1: Syllabus (May 9 - July 19)</span>
                  </div>
                  <div className={`${styles.trackPhase} ${syllabusPhase === 2 ? styles.trackPhaseActive : ''}`} style={{ flex: 45, background: 'rgba(6, 182, 212, 0.1)', color: 'var(--accent-secondary)', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
                    <span>P2: Practice (July 20 - Sep 3)</span>
                  </div>
                  <div className={`${styles.trackPhase} ${syllabusPhase === 3 ? styles.trackPhaseActive : ''}`} style={{ flex: 75, background: 'rgba(245, 158, 11, 0.1)', color: 'var(--accent-tertiary)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                    <span>P3: Mocks (Sep 4 - Nov 22)</span>
                  </div>
                </div>
              </div>

              {syllabusPhase === 1 && (
                <>
                  <div className={styles.timelineTrackRow} style={{ marginTop: '0.5rem' }}>
                    <div className={styles.trackLabel} style={{ fontSize: '0.6rem', opacity: 0.7 }}>QUANTS</div>
                    <div className={styles.trackCells} style={{ height: '24px' }}>
                      <div className={styles.trackPhase} style={{ flex: 23, background: 'rgba(139, 92, 246, 0.05)', fontSize: '0.6rem' }}>Algebra</div>
                      <div className={styles.trackPhase} style={{ flex: 28, background: 'rgba(139, 92, 246, 0.03)', fontSize: '0.6rem' }}>Arithmetic</div>
                      <div className={styles.trackPhase} style={{ flex: 14, background: 'rgba(139, 92, 246, 0.05)', fontSize: '0.6rem' }}>Geometry</div>
                      <div className={styles.trackPhase} style={{ flex: 7, background: 'rgba(139, 92, 246, 0.03)', fontSize: '0.6rem' }}>Modern</div>
                    </div>
                  </div>
                  <div className={styles.timelineTrackRow}>
                    <div className={styles.trackLabel} style={{ fontSize: '0.6rem', opacity: 0.7 }}>DILR</div>
                    <div className={styles.trackCells} style={{ height: '24px' }}>
                      <div className={styles.trackPhase} style={{ flex: 42, background: 'rgba(6, 182, 212, 0.05)', fontSize: '0.6rem' }}>LR Intensive</div>
                      <div className={styles.trackPhase} style={{ flex: 30, background: 'rgba(6, 182, 212, 0.03)', fontSize: '0.6rem' }}>DI Intensive</div>
                    </div>
                  </div>
                </>
              )}
            </div>
            
            <div className={styles.timelineProgressFooter}>
              <div className={styles.footerStat}>
                <span className={styles.footerLabel}>Overall Completion</span>
                {(() => {
                  const progressData = generateSyllabusProgress();
                  const totalCovered = progressData.reduce((sum, item) => sum + item.coveredTopics, 0);
                  const totalTopics = progressData.reduce((sum, item) => sum + item.totalTopicsCount, 0);
                  const overallPercent = totalTopics > 0 ? Math.round((totalCovered / totalTopics) * 100) : 0;
                  return (
                    <>
                      <div className={styles.overallProgressContainer}>
                        <div className={styles.overallProgressFill} style={{ width: `${overallPercent}%` }} />
                      </div>
                      <span className={styles.footerValue}>{overallPercent}%</span>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>

          <div className={styles.syllabusSearchWrapper}>
            <div className={styles.searchBar}><Search size={20} color="#64748B" /><input type="text" placeholder="Search milestones..." value={syllabusSearch} onChange={e => setSyllabusSearch(e.target.value)} className={styles.searchInput} /></div>
            {syllabusPhase === 1 && (
              <div className={styles.filterGroup}>
                <button className={`${styles.filterBtn} ${coverageFilter === 'all' ? styles.filterBtnActive : ''}`} onClick={() => setCoverageFilter('all')}>All Topics</button>
                <button className={`${styles.filterBtn} ${coverageFilter === 'covered' ? styles.filterBtnActive : ''}`} onClick={() => setCoverageFilter('covered')}>Covered</button>
                <button className={`${styles.filterBtn} ${coverageFilter === 'pending' ? styles.filterBtnActive : ''}`} onClick={() => setCoverageFilter('pending')}>Yet to Cover</button>
              </div>
            )}
          </div>

          <div className={styles.syllabusGridDetailed}>
            {syllabusPhase === 1 && generateSyllabusProgress().map((item, index) => (
              <section key={index} className={styles.syllabusSectionCard}>
                <div className={styles.syllabusSectionHeader}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div className={styles.sectionColorDot} style={{ backgroundColor: item.color }} />
                    <div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{item.name}</h3>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{item.coveredTopics} of {item.totalTopicsCount} topics covered</p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: item.color }}>{item.progress}%</div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      {item.id === 'quants' && (
                        <>
                          <button 
                            onClick={() => {
                              setSelectedCategory(item.id);
                              setModalState('topic_details');
                              setModalView('category_gallery');
                            }}
                            style={{ background: 'rgba(139, 92, 246, 0.1)', color: 'var(--accent-primary)', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s ease' }}
                            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(139, 92, 246, 0.2)'}
                            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)'}
                          >
                            View Tricks
                          </button>
                          <button 
                            onClick={() => {
                              setSelectedCategory(item.id);
                              setModalState('topic_details');
                              setModalView('category_questions_gallery');
                            }}
                            style={{ background: 'rgba(6, 182, 212, 0.1)', color: 'var(--accent-secondary)', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s ease' }}
                            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(6, 182, 212, 0.2)'}
                            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(6, 182, 212, 0.1)'}
                          >
                            View Questions
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className={styles.progressBarBg} style={{ height: '8px', margin: '1rem 0' }}><div className={`${styles.progressBarFill}`} style={{ width: `${item.progress}%`, backgroundColor: item.color }} /></div>
                <div className={styles.syllabusDetailedTable}>
                  {CAT_SYLLABUS[item.id].map(cat => {
                    const timelineId = `${item.id}_${cat.category}`;
                    const isViewingTimeline = viewingTimeline === timelineId;
                    
                    const filteredTopics = cat.topics.filter(topic => {
                      const matchesSearch = topic.toLowerCase().includes(syllabusSearch.toLowerCase());
                      const isDone = sessions.some(s => s.topic === item.id && (s.subTopics && s.subTopics.includes(topic)));
                      if (coverageFilter === 'covered') return matchesSearch && isDone;
                      if (coverageFilter === 'pending') return matchesSearch && !isDone;
                      return matchesSearch;
                    });
                    if (filteredTopics.length === 0 && (syllabusSearch || coverageFilter !== 'all')) return null;
                    return (
                      <div key={cat.category} className={styles.syllabusCatGroup}>
                        <div className={styles.syllabusCatHeader}>
                          <div className={styles.syllabusCatTitleGroup}>
                            <h4 className={styles.syllabusCatTitle}>{cat.category}</h4>
                            <span className={`${styles.importanceBadge} ${styles['importance' + cat.importance]}`}>
                              {cat.importance} Importance
                            </span>
                          </div>
                          {(item.id === 'quants' || (item.id === 'dilr' && (cat.category === 'Logical Reasoning' || cat.category === 'Data Interpretation'))) && (
                            <button 
                              onClick={() => setViewingTimeline(isViewingTimeline ? null : timelineId)}
                              style={{ 
                                display: 'flex', alignItems: 'center', gap: '0.4rem', 
                                padding: '0.4rem 0.8rem', borderRadius: '6px', 
                                background: isViewingTimeline ? 'var(--accent-primary)' : 'rgba(139, 92, 246, 0.05)', 
                                color: isViewingTimeline ? 'white' : 'var(--accent-primary)',
                                border: '1px solid rgba(139, 92, 246, 0.1)', fontWeight: 700, cursor: 'pointer',
                                fontSize: '0.75rem', transition: 'all 0.2s',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              <Calendar size={14} />
                              {isViewingTimeline ? 'Hide Plan' : 'View Plan'}
                            </button>
                          )}
                        </div>

                        {isViewingTimeline && (
                          <div style={{ marginBottom: '1.5rem', padding: '1.25rem', background: 'rgba(139, 92, 246, 0.03)', borderRadius: '12px', border: '1px solid rgba(139, 92, 246, 0.1)', animation: 'fadeIn 0.3s' }}>
                            <h5 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--accent-primary)' }}>
                              <Clock size={16} />
                              {cat.category === 'Algebra' ? 'Algebra Intensive Roadmap (May 09-31)' : 
                               cat.category === 'Arithmetic' ? 'Arithmetic Intensive Roadmap (June 01-28)' :
                               cat.category === 'Geometry' ? 'Geometry Intensive Roadmap (June 29 - July 12)' :
                               cat.category === 'Modern Maths' ? 'Modern Maths Intensive Roadmap (July 13-19)' :
                               cat.category === 'Logical Reasoning' ? 'LR Intensive Roadmap (May 11 - June 21)' :
                               `${cat.category} Study Roadmap`}
                            </h5>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              {(cat.category === 'Algebra' ? ALGEBRA_PLAN : cat.category === 'Arithmetic' ? ARITHMETIC_PLAN : cat.category === 'Geometry' ? GEOMETRY_PLAN : cat.category === 'Modern Maths' ? MODERN_MATHS_PLAN : cat.category === 'Data Interpretation' ? DI_PLAN : LR_PLAN).map((plan, idx) => {
                                  const start = new Date(2026, plan.startMonth, plan.startDay);
                                  const end = addDays(start, plan.days - 1);
                                  const isToday = new Date() >= start && new Date() <= end;
                                  return (
                                    <div key={idx} style={{ 
                                      display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.75rem', 
                                      borderRadius: '6px', background: isToday ? 'rgba(139, 92, 246, 0.08)' : 'white',
                                      border: isToday ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)'
                                    }}>
                                      <div style={{ minWidth: '100px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                                        {format(start, 'MMM dd')} - {format(end, 'MMM dd')}
                                      </div>
                                      <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: isToday ? 'var(--accent-primary)' : '#CBD5E1' }} />
                                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{plan.name}</span>
                                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{plan.days}d</span>
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>
                          </div>
                        )}
                        <div className={styles.syllabusTopicGrid}>
                          {filteredTopics.map(topic => {
                            const isDone = sessions.some(s => s.topic === item.id && (s.subTopics && s.subTopics.includes(topic)));
                            return (<div key={topic} className={`${styles.topicChip} ${isDone ? styles.topicChipDone : ''}`} onClick={() => toggleTopicCompletion(item.id, topic)} style={{ cursor: 'pointer' }}>{isDone ? <CheckCircle2 size={14} /> : <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '1px solid #CBD5E1' }} />}{topic}</div>);
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}

            {syllabusPhase === 2 && SYLLABUS_TOPICS.map((item, index) => {
              const phase1End = new Date(new Date().getFullYear(), 6, 18);
              const phase2Sessions = sessions.filter(s => s.topic === item.id && new Date(s.date) > phase1End);
              const totalQs = phase2Sessions.reduce((sum, s) => sum + s.questionsDone, 0);
              const targetQs = 1000;
              const progress = Math.min(100, Math.round((totalQs / targetQs) * 100));
              return (
                <section key={index} className={styles.syllabusSectionCard}>
                  <div className={styles.syllabusSectionHeader}><div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}><div className={styles.sectionColorDot} style={{ backgroundColor: item.color }} /><div><h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{item.name} Practice</h3><p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{totalQs} of {targetQs} CAT-Level questions solved</p></div></div><div style={{ textAlign: 'right' }}><div style={{ fontSize: '1.5rem', fontWeight: 800, color: item.color }}>{progress}%</div></div></div>
                  <div className={styles.progressBarBg} style={{ height: '8px', margin: '1rem 0' }}><div className={`${styles.progressBarFill}`} style={{ width: `${progress}%`, backgroundColor: item.color }} /></div>
                  <div className={styles.milestoneGrid}>{[200, 400, 600, 800, 1000].map(m => { const isReached = totalQs >= m; return (<div key={m} className={`${styles.milestoneChip} ${isReached ? styles.milestoneReached : ''}`}><Target size={16} /> Milestone: {m} Qs {isReached && <CheckCircle size={14} />}</div>); })}</div>
                </section>
              );
            })}

            {syllabusPhase === 3 && (
              <section className={styles.syllabusSectionCard}>
                <div className={styles.syllabusSectionHeader}><div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}><div className={styles.sectionColorDot} style={{ backgroundColor: '#F59E0B' }} /><div><h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Mock Test Marathon</h3><p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>30 Full-Length Mocks Tracker</p></div></div></div>
                <div className={styles.mockGrid}>
                  {Array.from({ length: 30 }).map((_, i) => {
                    const phase1End = new Date(new Date().getFullYear(), 6, 18);
                    const phase2End = addDays(phase1End, 45);
                    const phase3Sessions = sessions.filter(s => new Date(s.date) > phase2End);
                    const isMockDone = i < phase3Sessions.length;
                    return (<div key={i} className={`${styles.mockBox} ${isMockDone ? styles.mockBoxDone : ''}`}><div style={{ fontSize: '0.75rem', fontWeight: 700 }}>MOCK {i + 1}</div>{isMockDone ? <CheckCircle size={18} /> : <Clock size={18} style={{ opacity: 0.3 }} />}</div>);
                  })}
                </div>
              </section>
            )}
          </div>
        </div>
      )}

    </main>
  );
}
