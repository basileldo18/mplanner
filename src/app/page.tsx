"use client";

import React, { useState, useEffect } from 'react';
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
  AlertTriangle
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
import { getSessions, saveSession, deleteSession, clearAllSessions, type StudySession } from '@/lib/actions';

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
    { category: 'Logical Reasoning', importance: 'High', topics: ['Puzzles', 'Binary Logics', 'Venn Diagrams', 'Cubes', 'Linear Arrangement', 'Circular Arrangement', 'Ranking & Order', 'Routes & Network', 'Games & Tournaments', 'Selection & Distribution', 'Quant-based LR'] }
  ]
};

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

  // Modal & Timer State
  const [modalState, setModalState] = useState<'closed' | 'setup' | 'save' | 'add_topic'>('closed');
  const [activeSection, setActiveSection] = useState('quants');
  const [activeTopics, setActiveTopics] = useState<string[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);

  // Form State after studying
  const [questionsDone, setQuestionsDone] = useState('');
  const [conceptMastered, setConceptMastered] = useState(false);

  useEffect(() => {
    setMounted(true);
    const today = new Date();
    const currentYear = today.getFullYear();
    let target = new Date(currentYear, 10, 29); // Nov 29
    if (today > target) target = new Date(currentYear + 1, 10, 29);
    setDaysLeft(differenceInDays(target, today));

    const loadData = async () => {
      try {
        const data = await getSessions();
        setSessions(data);
      } catch (err) {
        console.error("Failed to load sessions:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

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
      conceptMastered
    };

    try {
      await saveSession(newSession);
      setSessions(prev => [newSession, ...prev]);
      setQuestionsDone('');
      setConceptMastered(false);
      setActiveTopics([]);
      setModalState('closed');
    } catch (err) {
      alert("Failed to save session to cloud. Please check your connection.");
    }
  };

  const toggleTopicCompletion = async (sectionId: string, topicName: string) => {
    const isDone = sessions.some(s => s.topic === sectionId && (s.subTopic === topicName || (s.subTopics && s.subTopics.includes(topicName))));
    
    if (isDone) {
      const sessionToDelete = sessions.find(s => s.topic === sectionId && (s.subTopic === topicName || (s.subTopics && s.subTopics.includes(topicName))));
      if (sessionToDelete) {
        try {
          await deleteSession(sessionToDelete.id);
          setSessions(prev => prev.filter(s => s.id !== sessionToDelete.id));
        } catch (err) {
          alert("Failed to remove topic status from cloud.");
        }
      }
    } else {
      const manualSession: StudySession = {
        id: `manual-${Date.now()}`,
        date: new Date().toISOString(),
        topic: sectionId,
        subTopics: [topicName],
        timeSpent: 0,
        questionsDone: 0,
        conceptMastered: true
      };
      try {
        await saveSession(manualSession);
        setSessions(prev => [manualSession, ...prev]);
      } catch (err) {
        alert("Failed to mark topic as complete in cloud.");
      }
    }
  };

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

  // Metrics
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
    const totalTopics = Object.values(CAT_SYLLABUS).reduce((acc, catList) => 
      acc + catList.reduce((sum, cat) => sum + cat.topics.length, 0), 0);
    const uniqueTopicsCovered = new Set();
    sessions.forEach(s => {
      if (s.subTopic) uniqueTopicsCovered.add(s.subTopic);
      if (s.subTopics) s.subTopics.forEach(t => uniqueTopicsCovered.add(t));
    });
    return Math.min(100, Math.round((uniqueTopicsCovered.size / totalTopics) * 100));
  };

  const getPhaseInfo = () => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const phase1End = new Date(currentYear, 5, 25); // June 25
    const phase2End = addDays(phase1End, 45); // ~Aug 09
    const phase3End = new Date(currentYear, 10, 29); // Nov 29
    
    const phases = [
      { id: 1, name: "Phase 1: Syllabus", end: phase1End, icon: <BookOpen size={16} /> },
      { id: 2, name: "Phase 2: Practice", end: phase2End, icon: <Target size={16} /> },
      { id: 3, name: "Phase 3: Mocks", end: phase3End, icon: <Flame size={16} /> }
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

  const getDaysToJune25 = () => {
    const today = new Date();
    const target = new Date(today.getFullYear(), 5, 25); // June 25
    if (today > target) return 0;
    return differenceInDays(target, today);
  };

  const getForecast = () => {
    const today = new Date();
    const totalTopics = Object.values(CAT_SYLLABUS).reduce((acc, catList) => 
      acc + catList.reduce((sum, cat) => sum + cat.topics.length, 0), 0);
    
    const coveredTopicsSet = new Set();
    sessions.forEach(s => {
      if (s.subTopic) coveredTopicsSet.add(s.subTopic);
      if (s.subTopics) s.subTopics.forEach(t => coveredTopicsSet.add(t));
    });
    
    const coveredTopics = coveredTopicsSet.size;
    const remainingTopics = totalTopics - coveredTopics;
    const daysUntilJune25 = getDaysToJune25();
    
    if (daysUntilJune25 <= 0) return null;
    
    const requiredTopicsPerDay = (remainingTopics / daysUntilJune25).toFixed(1);
    
    // Calculate current pace: topics covered in the last 7 days / 7
    const sevenDaysAgo = subDays(new Date(), 7);
    const recentTopicsSet = new Set();
    sessions.filter(s => new Date(s.date) >= sevenDaysAgo).forEach(s => {
      if (s.subTopic) recentTopicsSet.add(s.subTopic);
      if (s.subTopics) s.subTopics.forEach(t => recentTopicsSet.add(t));
    });
    const recentTopics = recentTopicsSet.size;
    const currentPace = (recentTopics / 7).toFixed(1);
    
    const isOnTrack = Number(currentPace) >= Number(requiredTopicsPerDay);
    
    // Daily Hour Targets
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
      daysUntilJune25,
      requiredTopicsPerDay,
      currentPace,
      isOnTrack,
      dailyTargets,
      todayHours,
      metTarget,
      advice: isOnTrack 
        ? (metTarget ? "You're killing it! Pace and daily goals are perfect." : `On track for June 25, but try to hit your ${dailyTargets.total}h target today.`)
        : `Speed up! You need ~${requiredTopicsPerDay} topics daily. Try to stick to your ${dailyTargets.total}h study plan.`
    };
  };

  const getRecommendation = () => {
    const today = new Date();
    const isWeekend = [0, 6].includes(today.getDay());
    
    if (!isWeekend) return null;

    // Find topics studied this week (Monday to Friday)
    const mondayOfThisWeek = subDays(today, today.getDay() === 0 ? 6 : today.getDay() - 1);
    const fridayOfThisWeek = addDays(mondayOfThisWeek, 4);
      
    const weeklySessions = sessions.filter(s => {
      const d = new Date(s.date);
      return d >= mondayOfThisWeek && d <= fridayOfThisWeek && s.timeSpent > 0;
    });
    
    const weeklyTopicsSet = new Set();
    weeklySessions.forEach(s => {
      if (s.subTopic) weeklyTopicsSet.add(s.subTopic);
      if (s.subTopics) s.subTopics.forEach(t => weeklyTopicsSet.add(t));
    });
    const weeklyTopics = [...weeklyTopicsSet];
    
    if (weeklyTopics.length > 0) {
      return {
        topic: "Weekly Intensive Practice",
        task: `Solve Arun Sharma Level 1 & 2 questions for: ${weeklyTopics.join(', ')}`,
        section: 'mixed',
        category: 'Weekend Special',
        isWeeklyReview: true,
        weeklyTopics
      };
    }

    const allPending = [];
    for (const section in CAT_SYLLABUS) {
      for (const cat of CAT_SYLLABUS[section]) {
        for (const topic of cat.topics) {
          const isDone = sessions.some(s => s.topic === section && (s.subTopic === topic || (s.subTopics && s.subTopics.includes(topic))));
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

  // Chart Generators
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
    return SYLLABUS_TOPICS.map(topic => {
      const topicSessions = sessions.filter(s => s.topic === topic.id);
      const timeSpent = topicSessions.reduce((sum, s) => sum + s.timeSpent, 0);
      const qsDone = topicSessions.reduce((sum, s) => sum + s.questionsDone, 0);
      
      const coveredTopicsSet = new Set();
      topicSessions.forEach(s => {
        if (s.subTopic) coveredTopicsSet.add(s.subTopic);
        if (s.subTopics) s.subTopics.forEach(t => coveredTopicsSet.add(t));
      });
      const coveredTopics = coveredTopicsSet.size;
      const totalTopicsCount = CAT_SYLLABUS[topic.id].reduce((acc, cat) => acc + cat.topics.length, 0);
      const progress = Math.min(100, Math.round((coveredTopics / totalTopicsCount) * 100)) || 0;
      return { ...topic, progress, timeSpent, qsDone, coveredTopics, totalTopicsCount };
    });
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
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => setModalState('setup')} disabled={isTimerActive} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: isTimerActive ? 'var(--text-muted)' : 'var(--accent-primary)', color: 'white', border: 'none', padding: '0.75rem 1.25rem', borderRadius: '8px', fontWeight: 600, cursor: isTimerActive ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}><Play size={20} fill="currentColor" /> {isTimerActive ? 'Session Active' : 'Start Session'}</button>
          <div className={styles.countdownCard} style={{ borderColor: 'var(--accent-secondary)' }}><Target size={32} color="var(--accent-secondary)" /><div><div className={styles.countdownValue} style={{ color: 'var(--accent-secondary)' }}>{phaseInfo.daysLeft}</div><div className={styles.countdownLabel}>Days left in {phaseInfo.id === 1 ? 'Phase 1' : phaseInfo.id === 2 ? 'Phase 2' : 'Phase 3'}</div></div></div>
          <div className={styles.countdownCard}><CalendarDays size={32} color="#06B6D4" /><div><div className={styles.countdownValue}>{daysLeft}</div><div className={styles.countdownLabel}>Days until CAT</div></div></div>
        </div>
      </header>

      {isTimerActive && (
        <div className={styles.activeSessionBanner}>
          <div className={styles.activeSessionInfo}>
            <div className={styles.activeSessionPulse}></div>
            <div>
              <strong style={{ display: 'block', fontSize: '0.9rem' }}>STUDYING NOW</strong>
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
            <div className={styles.modalHeader}>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>
                {modalState === 'setup' ? "Ignite Your Focus" : 
                 modalState === 'add_topic' ? "Expand Your Focus" : 
                 "Victory Lap: Session Summary"}
              </h2>
              <button onClick={() => setModalState('closed')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={28} /></button>
            </div>

            {modalState === 'add_topic' && (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div className={styles.formGroup}>
                  <label>Currently Studying</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                    {activeTopics.map(t => <span key={t} className={styles.topicChipDone} style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}>{t}</span>)}
                  </div>
                  <label>Add Another Topic to this Session</label>
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
                <button className={styles.btnPrimary} onClick={() => setModalState('closed')}>Back to Session</button>
              </div>
            )}

            {modalState === 'setup' && (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div className={styles.formGroup}>
                  <label>Select Your Battleground</label>
                  <div className={styles.sectionChipGrid}>
                    {SYLLABUS_TOPICS.map(t => (
                      <div 
                        key={t.id} 
                        className={`${styles.sectionChip} ${activeSection === t.id ? styles.sectionChipActive : ''}`}
                        onClick={() => {
                          setActiveSection(t.id);
                          setActiveTopics([]); // Reset topics when section changes
                        }}
                      >
                        <BookOpen size={24} />
                        <span>{t.name.split(' ')[0]}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Specific Chapter / Topic</label>
                  <select className={styles.formSelect} value={activeTopics[0] || ""} onChange={e => setActiveTopics([e.target.value])}>
                    <option value="" disabled>Choose a topic...</option>
                    {CAT_SYLLABUS[activeSection]?.map(cat => (
                      <optgroup key={cat.category} label={cat.category}>
                        {cat.topics.map(topic => <option key={topic} value={topic}>{topic}</option>)}
                      </optgroup>
                    ))}
                  </select>
                </div>

                <button className={styles.btnPrimary} onClick={handleStartStudy} disabled={activeTopics.length === 0} style={{ marginTop: '1rem', opacity: activeTopics.length === 0 ? 0.5 : 1 }}>
                  <Play size={20} fill="currentColor" /> Let's Go! Start Studying
                </button>
              </div>
            )}

            {modalState === 'save' && (
              <form onSubmit={handleSaveSession} style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem', padding: '2rem', background: 'var(--bg-main)', borderRadius: '20px' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase' }}>Focus Time</div>
                  <div style={{ fontSize: '3.5rem', fontWeight: 800, color: 'var(--accent-primary)', letterSpacing: '-2px' }}>{formatTime(elapsedSeconds)}</div>
                </div>
                
                <div className={styles.formGroup}>
                  <label>Questions Conquered</label>
                  <input className={styles.formInput} type="number" min="0" value={questionsDone} onChange={e => setQuestionsDone(e.target.value)} placeholder="How many problems did you solve?" />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1rem 0', padding: '1rem', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                  <input type="checkbox" id="concept" checked={conceptMastered} onChange={e => setConceptMastered(e.target.checked)} style={{ width: '22px', height: '22px', cursor: 'pointer' }} />
                  <label htmlFor="concept" style={{ fontSize: '1rem', fontWeight: 600, cursor: 'pointer', color: '#059669' }}>I've mastered this concept today!</label>
                </div>

                <button type="submit" className={styles.btnSuccess} style={{ marginTop: '1rem' }}>Log My Victory</button>
              </form>
            )}
          </div>
        </div>
      )}

      {activeTab === 'dashboard' && (
        <>
          <div className={styles.grid}>
            <div className={`${styles.card} ${styles.cardPrimary}`}><div className={styles.cardHeader}><span className={styles.cardTitle}>Total Study Time</span><div className={`${styles.cardIcon} ${styles.cardIconPrimary}`}><Clock size={20} /></div></div><div className={styles.cardValue}>{totalStudyTime.toFixed(1)}h</div><div className={styles.cardSubtext}>Lifetime hours logged</div></div>
            <div className={`${styles.card} ${styles.cardSecondary}`}><div className={styles.cardHeader}><span className={styles.cardTitle}>Concepts Mastered</span><div className={`${styles.cardIcon} ${styles.cardIconSecondary}`}><BookOpen size={20} /></div></div><div className={styles.cardValue}>{totalConcepts}</div><div className={styles.cardSubtext}>Key topics understood</div></div>
            <div className={`${styles.card} ${styles.cardTertiary}`}><div className={styles.cardHeader}><span className={styles.cardTitle}>Practice Qs Done</span><div className={`${styles.cardIcon} ${styles.cardIconTertiary}`}><Target size={20} /></div></div><div className={styles.cardValue}>{totalQuestions}</div><div className={styles.cardSubtext}>Problems solved</div></div>
            <div className={`${styles.card} ${styles.cardSuccess}`}><div className={styles.cardHeader}><span className={styles.cardTitle}>{phaseInfo.metricName}</span><div className={`${styles.cardIcon} ${styles.cardIconSuccess}`}><Target size={20} /></div></div><div className={styles.cardValue}>{phaseInfo.metricValue}</div><div className={styles.cardSubtext}>{phaseInfo.name}</div></div>
            <div className={`${styles.card} ${styles.cardSuccess}`} style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)' }}><div className={styles.cardHeader}><span className={styles.cardTitle}>Current Streak</span><div className={`${styles.cardIcon} ${styles.cardIconSuccess}`}><Flame size={20} /></div></div><div className={styles.cardValue}>{calculateStreak()} Days</div><div className={styles.cardSubtext}>Keep going!</div></div>
          </div>

          {forecast && phaseInfo.id === 1 && (
            <div className={styles.forecastBanner} style={{ borderColor: forecast.isOnTrack ? 'var(--accent-success)' : 'var(--accent-tertiary)' }}>
              <div className={styles.forecastInfo}>
                <div className={styles.forecastIcon} style={{ background: forecast.isOnTrack ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)' }}>
                  {forecast.isOnTrack ? <CheckCircle2 size={24} color="#10B981" /> : <AlertTriangle size={24} color="#F59E0B" />}
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Study Forecast: {forecast.isOnTrack ? 'On Track' : 'Needs Speed'}</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{forecast.advice}</p>
                </div>
              </div>
              <div className={styles.forecastStats}>
                <div className={styles.forecastStat}>
                  <div className={styles.forecastStatLabel}>Required Pace</div>
                  <div className={styles.forecastStatValue}>{forecast.requiredTopicsPerDay} <span style={{ fontSize: '0.7rem' }}>topics/day</span></div>
                </div>
                <div className={styles.forecastStatDivider} />
                <div className={styles.forecastStat}>
                  <div className={styles.forecastStatLabel}>Current Pace</div>
                  <div className={styles.forecastStatValue} style={{ color: forecast.isOnTrack ? 'var(--accent-success)' : 'var(--accent-danger)' }}>{forecast.currentPace} <span style={{ fontSize: '0.7rem' }}>topics/day</span></div>
                </div>
                <div className={styles.forecastStatDivider} />
                <div className={styles.forecastStat}>
                  <div className={styles.forecastStatLabel}>Remaining</div>
                  <div className={styles.forecastStatValue}>{forecast.remainingTopics} <span style={{ fontSize: '0.7rem' }}>topics</span></div>
                </div>
              </div>
              <div className={styles.dailyGoalCheck}>
                <div className={styles.goalTitle}>Today's Goal ({forecast.dailyTargets.total}h)</div>
                <div className={styles.goalProgressLine}>
                  <div className={styles.goalProgressFill} style={{ width: `${Math.min(100, (forecast.todayHours.total / forecast.dailyTargets.total) * 100)}%` }} />
                </div>
                <div className={styles.goalBreakdown}>
                  <span>Q: {forecast.todayHours.quants}/{forecast.dailyTargets.quants}h</span>
                  <span>D: {forecast.todayHours.dilr}/{forecast.dailyTargets.dilr}h</span>
                  <span>V: {forecast.todayHours.verbal}/{forecast.dailyTargets.verbal}h</span>
                </div>
              </div>
            </div>
          )}

          <div className={styles.dashboardGrid}>
            <div className={styles.dashboardMainCol}>
              {recommendation && (
                <div className={styles.missionCard}>
                  <div className={styles.missionHeader}>
                    <Flame size={20} color="var(--accent-danger)" />
                    <span>DAILY MISSION</span>
                  </div>
                  <div className={styles.missionContent}>
                    <h3>{recommendation.topic}</h3>
                    <p>{recommendation.task}</p>
                    <div className={styles.missionMeta}>
                      {!recommendation.isWeeklyReview ? (
                        <>
                          <span className={styles.badgeQuants}>{recommendation.section.toUpperCase()}</span>
                          <span className={styles.importanceBadge} style={{ background: 'rgba(0,0,0,0.05)', color: 'var(--text-main)' }}>{recommendation.category}</span>
                        </>
                      ) : (
                        <span className={styles.badgeVerbal}>WEEKLY SUMMARY</span>
                      )}
                    </div>
                  </div>
                  {!recommendation.isWeeklyReview ? (
                    <button className={styles.missionStartBtn} onClick={() => {
                      setActiveSection(recommendation.section);
                      setActiveTopics([recommendation.topic]);
                      setModalState('setup');
                    }}>Start Studying This Topic</button>
                  ) : (
                    <button className={styles.missionStartBtn} onClick={() => setModalState('setup')}>Start Weekend Practice Session</button>
                  )}
                </div>
              )}

              <section className={styles.section}><h2 className={styles.sectionTitle}><BarChart3 size={24} color="#8B5CF6" /> Study Consistency (Last 7 Days)</h2><div className={styles.chartContainer}><ResponsiveContainer width="100%" height="100%"><AreaChart data={generateChartData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}><defs><linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/><stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} /><XAxis dataKey="name" stroke="#9CA3AF" tick={{fill: '#9CA3AF'}} tickLine={false} axisLine={false} /><YAxis stroke="#9CA3AF" tick={{fill: '#9CA3AF'}} tickLine={false} axisLine={false} /><Tooltip content={<CustomTooltip />} /><Area type="monotone" dataKey="hours" stroke="#8B5CF6" strokeWidth={3} fillOpacity={1} fill="url(#colorHours)" /></AreaChart></ResponsiveContainer></div></section>
              <section className={styles.section}><h2 className={styles.sectionTitle}><CheckCircle2 size={24} color="#10B981" /> 60-Day Activity Log</h2><div className={styles.consistencyGrid}>{generateConsistencyBoxes()}</div></section>
            </div>
            
            <div className={styles.dashboardSideCol}>
              <section className={styles.section}><h2 className={styles.sectionTitle}><Info size={24} color="#F59E0B" /> CAT Exam Pattern</h2><div className={styles.examPatternGrid}><div className={styles.patternCard}><div className={styles.patternLabel}>Total Time</div><div className={styles.patternValue}>120 Mins</div></div><div className={styles.patternCard}><div className={styles.patternLabel}>Questions</div><div className={styles.patternValue}>68 Qs</div></div><div className={styles.patternCard}><div className={styles.patternLabel}>Total Marks</div><div className={styles.patternValue}>204 Marks</div></div><div className={styles.patternCard}><div className={styles.patternLabel}>Slots</div><div className={styles.patternValue}>3 Slots</div></div></div>
                  <div className={styles.weightageHeader}><TrendingUp size={20} color="#8B5CF6" /><span>Quants Topic Weightage (Recent Trends)</span></div>
                  <table className={styles.weightageTable}><thead><tr><th>Topic Group</th><th>Avg. Questions</th></tr></thead><tbody><tr><td>Arithmetic (Avg, Ratio, P&L, TSD)</td><td>8 - 10 Qs</td></tr><tr><td>Algebra (Equations, Log, Progressions)</td><td>6 - 8 Qs</td></tr><tr><td>Geometry & Mensuration</td><td>3 - 4 Qs</td></tr><tr><td>Number System</td><td>2 - 3 Qs</td></tr><tr><td>Modern Maths (P&C, Prob)</td><td>1 - 2 Qs</td></tr></tbody></table>
                  <table className={styles.patternTable}><thead><tr><th>Section</th><th>Questions</th><th>Marking (MCQ)</th><th>Marking (TITA)</th></tr></thead><tbody><tr><td>VARC</td><td>24 Qs</td><td><span className={`${styles.markingBadge} ${styles.markingPos}`}>+3</span> <span className={`${styles.markingBadge} ${styles.markingNeg}`}>-1</span></td><td><span className={`${styles.markingBadge} ${styles.markingPos}`}>+3</span> <span className={`${styles.markingBadge} ${styles.markingNeg}`} style={{ background: 'rgba(0,0,0,0.05)', color: 'var(--text-muted)' }}>0</span></td></tr><tr><td>DILR</td><td>22 Qs</td><td><span className={`${styles.markingBadge} ${styles.markingPos}`}>+3</span> <span className={`${styles.markingBadge} ${styles.markingNeg}`}>-1</span></td><td><span className={`${styles.markingBadge} ${styles.markingPos}`}>+3</span> <span className={`${styles.markingBadge} ${styles.markingNeg}`} style={{ background: 'rgba(0,0,0,0.05)', color: 'var(--text-muted)' }}>0</span></td></tr><tr><td>Quants</td><td>22 Qs</td><td><span className={`${styles.markingBadge} ${styles.markingPos}`}>+3</span> <span className={`${styles.markingBadge} ${styles.markingNeg}`}>-1</span></td><td><span className={`${styles.markingBadge} ${styles.markingPos}`}>+3</span> <span className={`${styles.markingBadge} ${styles.markingNeg}`} style={{ background: 'rgba(0,0,0,0.05)', color: 'var(--text-muted)' }}>0</span></td></tr></tbody></table>
              </section>
            </div>
          </div>
        </>
      )}

      {activeTab === 'analytics' && (
        <div className={styles.analyticsView}>
          <div className={styles.analyticsGrid}>
            <div className={styles.analyticsCard}><h2 className={styles.sectionTitle}><BarChart3 size={24} color="#8B5CF6" /> Sectional Breakdown</h2><div style={{ height: '300px', width: '100%' }}><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={generatePieData()} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">{generatePieData().map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}</Pie><Tooltip content={<CustomTooltip />} /><Legend verticalAlign="bottom" height={36}/></PieChart></ResponsiveContainer></div></div>
            <div className={styles.analyticsCard}><h2 className={styles.sectionTitle}><TrendingUp size={24} color="#10B981" /> Daily Progress (14 Days)</h2><div style={{ height: '300px', width: '100%' }}><ResponsiveContainer width="100%" height="100%"><BarChart data={generateDetailedDailyData()}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" /><XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} /><YAxis axisLine={false} tickLine={false} /><Tooltip content={<CustomTooltip />} /><Legend /><Bar dataKey="Quants" stackId="a" fill="#8B5CF6" /><Bar dataKey="Verbal" stackId="a" fill="#10B981" /><Bar dataKey="DILR" stackId="a" fill="#06B6D4" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div></div>
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
                <thead><tr><th>Date</th><th>Section</th><th>Time Spent</th><th>Questions</th><th>Mastery</th></tr></thead>
                <tbody>{sessions.length > 0 ? sessions.map((session) => (<tr key={session.id}><td><div className={styles.sessionDate}>{format(new Date(session.date), 'MMM dd, yyyy')}</div><div style={{ fontSize: '0.7rem', color: '#9CA3AF' }}>{format(new Date(session.date), 'hh:mm a')}</div></td><td><span className={`${styles.sessionBadge} ${session.topic === 'quants' ? styles.badgeQuants : session.topic === 'verbal' ? styles.badgeVerbal : styles.badgeDILR}`}>{session.topic.toUpperCase()}</span></td><td style={{ fontWeight: 600 }}>{session.timeSpent.toFixed(2)}h</td><td>{session.questionsDone} Qs</td><td>{session.conceptMastered ? (<span style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 600 }}><CheckCircle2 size={14} /> Mastered</span>) : '-'}</td></tr>)) : (<tr><td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No sessions logged yet. Start studying to see your history!</td></tr>)}</tbody>
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
                <div className={styles.syllabusSectionHeader}><div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}><div className={styles.sectionColorDot} style={{ backgroundColor: item.color }} /><div><h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{item.name}</h3><p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{item.coveredTopics} of {item.totalTopicsCount} topics covered</p></div></div><div style={{ textAlign: 'right' }}><div style={{ fontSize: '1.5rem', fontWeight: 800, color: item.color }}>{item.progress}%</div></div></div>
                <div className={styles.progressBarBg} style={{ height: '8px', margin: '1rem 0' }}><div className={`${styles.progressBarFill}`} style={{ width: `${item.progress}%`, backgroundColor: item.color }} /></div>
                <div className={styles.syllabusDetailedTable}>
                  {CAT_SYLLABUS[item.id].map(cat => {
                    const filteredTopics = cat.topics.filter(topic => {
                      const matchesSearch = topic.toLowerCase().includes(syllabusSearch.toLowerCase());
                      const isDone = sessions.some(s => s.topic === item.id && s.subTopic === topic);
                      if (coverageFilter === 'covered') return matchesSearch && isDone;
                      if (coverageFilter === 'pending') return matchesSearch && !isDone;
                      return matchesSearch;
                    });
                    if (filteredTopics.length === 0 && (syllabusSearch || coverageFilter !== 'all')) return null;
                    return (
                      <div key={cat.category} className={styles.syllabusCatGroup}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                          <h4 className={styles.syllabusCatTitle}>{cat.category}</h4>
                          <span className={`${styles.importanceBadge} ${styles['importance' + cat.importance]}`}>
                            {cat.importance} Importance
                          </span>
                        </div>
                        <div className={styles.syllabusTopicGrid}>
                          {filteredTopics.map(topic => {
                            const isDone = sessions.some(s => s.topic === item.id && (s.subTopic === topic || (s.subTopics && s.subTopics.includes(topic))));
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
              const phase1End = new Date(new Date().getFullYear(), 5, 25);
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
                    const phase1End = new Date(new Date().getFullYear(), 5, 25);
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
