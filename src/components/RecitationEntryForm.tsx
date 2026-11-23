import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Clock, Minus, Plus, RotateCcw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { QuranSurah, RecitationStatus } from '@/types';
import { JUZ_INDEX, formatAyahRange, getJuzEntriesForRange } from '@/lib/juzIndex';

type Notice = { type: 'success' | 'error'; text: string } | null;

export const recitationStatusLabels: Record<RecitationStatus, string> = {
  done: 'تم',
  not_ready: 'غير جاهز',
  repeat: 'يحتاج إعادة',
};

type SavedEntry = {
  id: string;
  surah_id: string;
  status: RecitationStatus;
  mistakes: number;
  hesitations: number;
  notes: string;
};

export function RecitationEntryForm({
  sessionId, studentId, studentName, surahs, fromSurahId, toSurahId, setNotice, onStudentComplete,
}: {
  sessionId: string;
  studentId: string;
  studentName: string;
  surahs: QuranSurah[];
  fromSurahId: string;
  toSurahId: string;
  setNotice: (n: Notice) => void;
  onStudentComplete: () => void;
}) {
  const [mistakes, setMistakes] = useState(0);
  const [hesitations, setHesitations] = useState(0);
  const [notes, setNotes] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<RecitationStatus>('done');
  const [saving, setSaving] = useState(false);
  const [savedEntries, setSavedEntries] = useState<SavedEntry[]>([]);
  const [currentSurahIndex, setCurrentSurahIndex] = useState(0);
  const [lastSavedEntry, setLastSavedEntry] = useState<SavedEntry | null>(null);

  const fromNumber = useMemo(() => surahs.find((s) => s.id === fromSurahId)?.surah_number ?? 1, [fromSurahId, surahs]);
  const toNumber = useMemo(() => surahs.find((s) => s.id === toSurahId)?.surah_number ?? 114, [toSurahId, surahs]);
  const rangeSurahs = useMemo(
    () => surahs.filter((s) => s.surah_number >= fromNumber && s.surah_number <= toNumber),
    [fromNumber, surahs, toNumber],
  );
  const currentSurah = rangeSurahs[currentSurahIndex];
  const nextSurah = rangeSurahs[currentSurahIndex + 1];
  const currentJuzEntries = currentSurah ? JUZ_INDEX.filter((e) => e.surahNumber === currentSurah.surah_number) : [];
  const currentJuz = currentJuzEntries[0]?.juz ?? 1;
  const allJuzInRange = useMemo(() => getJuzEntriesForRange(fromNumber, toNumber), [fromNumber, toNumber]);
  const uniqueJuz = useMemo(() => [...new Set(allJuzInRange.map((e) => e.juz))], [allJuzInRange]);

  const loadSaved = useCallback(async () => {
    const { data, error } = await supabase
      .from('recitation_entries')
      .select('id,surah_id,status,mistakes,hesitations,notes')
      .eq('session_id', sessionId)
      .eq('student_id', studentId)
      .eq('mode', 'recitation')
      .order('created_at', { ascending: true });
    if (error) {
      setNotice({ type: 'error', text: 'تعذر تحميل سجل تسميع الطالب.' });
      return;
    }
    const entries = (data ?? []) as SavedEntry[];
    setSavedEntries(entries);
    const savedSurahIds = new Set(entries.map((entry) => entry.surah_id));
    const firstUnsaved = rangeSurahs.findIndex((surah) => !savedSurahIds.has(surah.id));
    setCurrentSurahIndex(firstUnsaved >= 0 ? firstUnsaved : rangeSurahs.length);
  }, [rangeSurahs, sessionId, setNotice, studentId]);

  useEffect(() => {
    void loadSaved();
  }, [loadSaved]);

  useEffect(() => {
    setMistakes(0);
    setHesitations(0);
    setNotes('');
    setSelectedStatus('done');
  }, [currentSurahIndex, studentId]);

  const saveStatus = async () => {
    if (!currentSurah || saving) return;
    setSaving(true);
    const surahId = currentSurah.id;
    const surahName = currentSurah.name;
    const currentMistakes = mistakes;
    const currentHesitations = hesitations;
    const currentNotes = notes.trim();
    const status = selectedStatus;

    const { data, error } = await supabase.rpc('teacher_save_recitation_entry', {
      p_session_id: sessionId,
      p_student_id: studentId,
      p_mode: 'recitation',
      p_status: status,
      p_surah_from: surahId,
      p_surah_to: surahId,
      p_mistakes: currentMistakes,
      p_hesitations: currentHesitations,
      p_notes: currentNotes,
    });

    if (error || !data) {
      setSaving(false);
      setNotice({ type: 'error', text: `تعذر حفظ تسميع ${surahName}.` });
      return;
    }

    const row = data as { id: string };
    const entry: SavedEntry = {
      id: row.id,
      surah_id: surahId,
      status,
      mistakes: currentMistakes,
      hesitations: currentHesitations,
      notes: currentNotes,
    };
    setLastSavedEntry(entry);
    setSavedEntries((previous) => [...previous.filter((saved) => saved.surah_id !== surahId), entry]);
    setNotice({ type: 'success', text: `تم تأكيد سورة ${surahName}: ${recitationStatusLabels[status]}` });
    setCurrentSurahIndex((index) => Math.min(index + 1, rangeSurahs.length));
    setSaving(false);
  };

  const editLastSaved = () => {
    if (!lastSavedEntry || saving) return;
    const savedIndex = rangeSurahs.findIndex((surah) => surah.id === lastSavedEntry.surah_id);
    if (savedIndex < 0) return;
    setCurrentSurahIndex(savedIndex);
    setMistakes(lastSavedEntry.mistakes);
    setHesitations(lastSavedEntry.hesitations);
    setNotes(lastSavedEntry.notes);
    setSelectedStatus(lastSavedEntry.status);
    setNotice({ type: 'success', text: 'يمكنك تعديل آخر رصد ثم تأكيده من جديد.' });
  };

  const doneCount = savedEntries.filter((entry) => entry.status === 'done').length;
  const notReadyCount = savedEntries.filter((entry) => entry.status === 'not_ready').length;
  const repeatCount = savedEntries.filter((entry) => entry.status === 'repeat').length;
  const remaining = Math.max(0, rangeSurahs.length - savedEntries.length);
  const needsRework = savedEntries.filter((entry) => entry.status === 'repeat');

  if (rangeSurahs.length === 0) {
    return <div className="recitation-entry"><div className="empty-state">لا توجد سور في هذا النطاق. حدد المقرر أولًا.</div></div>;
  }

  if (!currentSurah) {
    const facesDone = savedEntries.filter((entry) => entry.status === 'done').reduce((sum, entry) => {
      const surah = surahs.find((item) => item.id === entry.surah_id);
      return sum + (surah?.face_count ? Number(surah.face_count) : 0);
    }, 0);
    return (
      <div className="recitation-entry">
        <div className="student-counters">
          <div className="counter-pill done"><strong>{doneCount}</strong><span>تم</span></div>
          <div className="counter-pill not-ready"><strong>{notReadyCount}</strong><span>غير جاهز</span></div>
          <div className="counter-pill repeat"><strong>{repeatCount}</strong><span>إعادة</span></div>
          <div className="counter-pill remaining"><strong>{remaining}</strong><span>متبقي</span></div>
        </div>
        <div className="surah-big-name">
          <Check size={28} />
          <h2>اكتمل نطاق {studentName}</h2>
          <p>{doneCount} سورة مؤكدة · {repeatCount} تحتاج إعادة · {notReadyCount} غير جاهزة · {facesDone.toFixed(1)} وجه منجز</p>
        </div>
        <button className="primary-button" style={{ width: '100%', justifyContent: 'center' }} onClick={onStudentComplete}>الانتقال للطالب التالي</button>
      </div>
    );
  }

  return (
    <div className="recitation-entry">
      <div className="student-counters">
        <div className="counter-pill done"><strong>{doneCount}</strong><span>تم</span></div>
        <div className="counter-pill not-ready"><strong>{notReadyCount}</strong><span>غير جاهز</span></div>
        <div className="counter-pill repeat"><strong>{repeatCount}</strong><span>إعادة</span></div>
        <div className="counter-pill remaining"><strong>{remaining}</strong><span>متبقي</span></div>
      </div>
      <div className="surah-progress-strip">
        <div className="progress-info"><span>السورة {currentSurahIndex + 1} من {rangeSurahs.length}</span><span>الجزء {currentJuz} من {uniqueJuz.length || 1}</span></div>
        <div className="progress-track"><span style={{ width: `${((currentSurahIndex + 1) / rangeSurahs.length) * 100}%` }} /></div>
      </div>
      <div className="surah-big-name">
        <span className="surah-juz-badge">الجزء {currentJuz}</span>
        <h2>{currentSurah.name}</h2>
        <p>{currentSurah.name_english} · {currentSurah.ayah_count} آية · {currentSurah.end_page - currentSurah.start_page + 1} وجه</p>
        {currentJuzEntries.length > 1 && <p className="ayah-range-hint">في الجزء: {currentJuzEntries.map((entry) => formatAyahRange(entry)).join('، ')}</p>}
      </div>
      <div className="counter-grid">
        <Counter label="الأخطاء" value={mistakes} onChange={setMistakes} />
        <Counter label="الترددات" value={hesitations} onChange={setHesitations} />
      </div>
      <label className="recitation-notes-label">ملاحظات المعلم<textarea value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={500} placeholder="أضف ملاحظة مختصرة عند الحاجة" rows={3} /></label>
      <div className="status-buttons" aria-label="حالة التسميع">
        <button type="button" className={`status-btn done-btn ${selectedStatus === 'done' ? 'selected' : ''}`} disabled={saving} onClick={() => setSelectedStatus('done')}><Check size={22} /> تم التسميع</button>
        <button type="button" className={`status-btn not-ready-btn ${selectedStatus === 'not_ready' ? 'selected' : ''}`} disabled={saving} onClick={() => setSelectedStatus('not_ready')}><Clock size={22} /> غير جاهز</button>
        <button type="button" className={`status-btn repeat-btn ${selectedStatus === 'repeat' ? 'selected' : ''}`} disabled={saving} onClick={() => setSelectedStatus('repeat')}><RotateCcw size={22} /> يحتاج إعادة</button>
      </div>
      <button type="button" className="confirm-recitation-button" disabled={saving} onClick={() => void saveStatus()}>
        <Check size={20} /> {saving ? 'جارٍ حفظ التأكيد...' : selectedStatus === 'done' ? 'تأكيد إتمام التسميع' : 'تأكيد تسجيل الحالة'}
      </button>
      <p className="confirmation-hint">لن تُحتسب السورة ولن ينتقل النظام قبل الضغط على زر التأكيد.</p>
      <div className="recitation-actions-row">
        {lastSavedEntry && <button type="button" className="undo-btn" disabled={saving} onClick={editLastSaved}><RotateCcw size={16} /> تعديل آخر رصد</button>}
        {saving && <span className="saving-indicator"><span className="loading-spinner" /> جارٍ الحفظ...</span>}
      </div>
      {nextSurah && <div className="next-surah-card"><span>السورة التالية</span><strong>{nextSurah.name}</strong></div>}
      {needsRework.length > 0 && (
        <div className="needs-rework-card"><h3>سور تحتاج إلى إعادة ضبط</h3>{needsRework.map((entry) => <div key={entry.id}><strong>{surahs.find((surah) => surah.id === entry.surah_id)?.name ?? '—'}</strong><span>{entry.mistakes} أخطاء · {entry.hesitations} ترددات</span></div>)}</div>
      )}
      {savedEntries.length > 0 && (
        <div className="saved-entries-list"><h3>السور المؤكدة في هذا اليوم</h3>{savedEntries.map((entry) => {
          const surah = surahs.find((item) => item.id === entry.surah_id);
          return <div key={entry.id} className={`saved-entry-row ${entry.status}`}><span className="saved-entry-name">{surah?.name ?? '—'}</span><span className="saved-entry-status">{recitationStatusLabels[entry.status]}</span><span className="saved-entry-counters">{entry.mistakes} أخطاء · {entry.hesitations} ترددات</span>{entry.notes && <span className="saved-entry-notes">{entry.notes}</span>}</div>;
        })}</div>
      )}
    </div>
  );
}

function Counter({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return <div className="counter-control"><span>{label}</span><div className="counter-body"><button type="button" onClick={() => onChange(Math.max(0, value - 1))} aria-label={`إنقاص ${label}`}><Minus size={20} /></button><strong>{value}</strong><button type="button" onClick={() => onChange(value + 1)} aria-label={`زيادة ${label}`}><Plus size={20} /></button></div></div>;
}
