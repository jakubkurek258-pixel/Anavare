import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { stateService, validateImage } from '../lib/stateService';
import { SAMPLE_COURSES } from '../data/rpgAssets';
import { Course, Lesson, UserLesson, TaskCategory } from '../types';
import { BookOpen, GraduationCap, CheckCircle, Lock, PlayCircle, Eye, RefreshCw, Sparkles, AlertCircle, Camera, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function CoursesView() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [userLessons, setUserLessons] = useState<UserLesson[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  // Preview local states
  const [courseImagePreview, setCourseImagePreview] = useState<string | null>(null);
  const [lessonImagePreviews, setLessonImagePreviews] = useState<{ [key: number]: string }>({});
  const [proofPreviewUrl, setProofPreviewUrl] = useState('');

  // Course Creator modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCourseDesc, setNewCourseDesc] = useState('');
  const [newCourseCategory, setNewCourseCategory] = useState<TaskCategory>('learning');
  const [newCourseImage, setNewCourseImage] = useState('');
  const [newCourseLessons, setNewCourseLessons] = useState<(Omit<Lesson, 'id'> & { videoUrl?: string; imageUrl?: string })[]>([
    { title: 'Calibration One', description: 'Initial parameters and setup.', duration: '10 min', xpReward: 50, contentMarkdown: '### Chapter 1: Foundations\n\nWelcome to your custom course lesson. Specify real-life quests here.', videoUrl: '', imageUrl: '' }
  ]);
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Media uploading states & handlers
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState('');
  const [uploadingVideoIdx, setUploadingVideoIdx] = useState<number | null>(null);
  const [videoUploadError, setVideoUploadError] = useState('');
  const [uploadingLessonImageIdx, setUploadingLessonImageIdx] = useState<number | null>(null);
  const [lessonImageUploadError, setLessonImageUploadError] = useState('');

  // Course deletion confirmation state
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [isDeletingCourse, setIsDeletingCourse] = useState(false);

  const handleDeleteCourse = async (courseId: string) => {
    if (!user) return;
    setIsDeletingCourse(true);
    try {
      await stateService.deleteCourse(courseId, user.id);
      setCourseToDelete(null);
      if (selectedCourse?.id === courseId) {
        setSelectedCourse(null);
        setSelectedLesson(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeletingCourse(false);
    }
  };

  const [proofUrl, setProofUrl] = useState('');
  const [proofType, setProofType] = useState<'image' | 'video' | null>(null);
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [proofUploadError, setProofUploadError] = useState('');

  // Reset proof state when changing lesson selection
  useEffect(() => {
    setProofUrl('');
    setProofType(null);
    setProofUploadError('');
    if (proofPreviewUrl) {
      try { URL.revokeObjectURL(proofPreviewUrl); } catch (e) {}
    }
    setProofPreviewUrl('');
  }, [selectedLesson?.id]);

  const handleProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setProofUploadError('');
    try {
      const isImg = file.type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'tiff'].includes(file.name.split('.').pop()?.toLowerCase() || '');
      const isVid = file.type.startsWith('video/') || ['mp4', 'mov'].includes(file.name.split('.').pop()?.toLowerCase() || '');
      const type = isImg ? 'image' : isVid ? 'video' : null;
      if (!type) {
        throw new Error('Only images (JPG, PNG, WEBP) and videos (MP4, MOV) are supported for task verification!');
      }

      if (type === 'image') {
        validateImage(file);
      } else {
        const maxVideoSize = 100 * 1024 * 1024; // 100 MB
        if (file.size > maxVideoSize) {
          throw new Error('The selected video is too large. Maximum size for video proof is 100 MB.');
        }
      }

      const objectUrl = URL.createObjectURL(file);
      setProofPreviewUrl(objectUrl);
      setProofType(type);
      setIsUploadingProof(true);

      const secureUrl = await stateService.uploadMedia(file, 'proofs', user.id);
      setProofUrl(secureUrl);

      URL.revokeObjectURL(objectUrl);
      setProofPreviewUrl('');
    } catch (err: any) {
      setProofUploadError(err?.message || 'Failed to seal proof file.');
      setProofPreviewUrl('');
      setProofType(null);
    } finally {
      setIsUploadingProof(false);
      e.target.value = '';
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageUploadError('');

    try {
      validateImage(file);

      const objectUrl = URL.createObjectURL(file);
      setCourseImagePreview(objectUrl);
      setIsUploadingImage(true);

      const downloadUrl = await stateService.uploadMedia(file, 'courses', user?.id || '');
      setNewCourseImage(downloadUrl);

      URL.revokeObjectURL(objectUrl);
      setCourseImagePreview(null);
    } catch (err: any) {
      setImageUploadError(err?.message || 'Failed to upload cover image.');
      setCourseImagePreview(null);
    } finally {
      setIsUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleVideoUpload = async (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingVideoIdx(idx);
    setVideoUploadError('');

    try {
      const downloadUrl = await stateService.uploadMedia(file, 'lessons', user?.id || '');
      handleLessonChange(idx, 'videoUrl', downloadUrl);
    } catch (err: any) {
      setVideoUploadError(err?.message || 'Failed to upload lesson video.');
    } finally {
      setUploadingVideoIdx(null);
      e.target.value = '';
    }
  };

  const handleLessonImageUpload = async (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLessonImageUploadError('');

    try {
      validateImage(file);

      const objectUrl = URL.createObjectURL(file);
      setLessonImagePreviews(prev => ({ ...prev, [idx]: objectUrl }));
      setUploadingLessonImageIdx(idx);

      const downloadUrl = await stateService.uploadMedia(file, 'lessons_images', user?.id || '');
      handleLessonChange(idx, 'imageUrl', downloadUrl);

      URL.revokeObjectURL(objectUrl);
      setLessonImagePreviews(prev => {
        const next = { ...prev };
        delete next[idx];
        return next;
      });
    } catch (err: any) {
      setLessonImageUploadError(err?.message || 'Failed to upload lesson photo.');
      setLessonImagePreviews(prev => {
        const next = { ...prev };
        delete next[idx];
        return next;
      });
    } finally {
      setUploadingLessonImageIdx(null);
      e.target.value = '';
    }
  };

  // Subscribe to central courses index (built-ins + customs)
  useEffect(() => {
    if (!user) return;
    const unsub = stateService.subscribeToCourses(user.id, (list) => {
      setCourses(list);
    });
    return unsub;
  }, [user]);

  // Subscribe to user lesson completions
  useEffect(() => {
    if (!user) return;
    const unsub = stateService.subscribeToUserLessons(user.id, (list) => {
      setUserLessons(list);
    });
    return unsub;
  }, [user]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] font-mono text-indigo-400">
        LOADING EDUCATION TERMINAL...
      </div>
    );
  }

  const canCreateCourse = user.level >= 10;

  // Helper to determine course completions percentage
  const getCourseProgress = (courseId: string) => {
    const course = courses.find(c => c.id === courseId);
    if (!course) return 0;
    const lessonIds = course.lessons.map(l => l.id);
    const completedCount = userLessons.filter(ul => ul.courseId === courseId && ul.completed && lessonIds.includes(ul.lessonId)).length;
    return Math.round((completedCount / course.lessons.length) * 100);
  };

  const isLessonCompleted = (courseId: string, lessonId: string) => {
    return userLessons.some(ul => ul.courseId === courseId && ul.lessonId === lessonId && ul.completed);
  };

  const handleCompleteLesson = async (course: Course, lesson: Lesson) => {
    try {
      await stateService.completeLesson(
        user.id, 
        course.id, 
        lesson.id, 
        lesson.xpReward, 
        proofUrl || undefined, 
        proofType || undefined
      );
      setProofUrl('');
      setProofType(null);
      // Automatically refresh active references
      if (selectedLesson?.id === lesson.id) {
        setSelectedLesson(lesson);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddLesson = () => {
    setNewCourseLessons([
      ...newCourseLessons,
      { title: '', description: '', duration: '10 min', xpReward: 50, contentMarkdown: '', videoUrl: '' }
    ]);
  };

  const handleLessonChange = (index: number, field: string, value: any) => {
    const updated = [...newCourseLessons];
    updated[index] = { ...updated[index], [field]: value };
    setNewCourseLessons(updated);
  };

  const handleRemoveLesson = (index: number) => {
    if (newCourseLessons.length <= 1) return;
    setNewCourseLessons(newCourseLessons.filter((_, idx) => idx !== index));
  };

  const handleCreateCourseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseTitle.trim() || !newCourseDesc.trim()) {
      setErrorMsg('Course title and description are strictly required.');
      return;
    }

    if (user.level < 10) {
      setErrorMsg('Unauthorized: You need to reach level 10 to create courses.');
      return;
    }

    for (let i = 0; i < newCourseLessons.length; i++) {
      const les = newCourseLessons[i];
      if (!les.title.trim() || !les.description.trim() || !les.contentMarkdown.trim()) {
        setErrorMsg(`Lesson #${i + 1} must have a title, short description, and objectives content.`);
        return;
      }
    }

    setErrorMsg('');
    setSubmitting(true);

    try {
      const totalLessonsXp = newCourseLessons.reduce((acc, l) => acc + (l.xpReward || 50), 0);
      const xpReward = totalLessonsXp + 100;

      await stateService.createCourse(
        user.id,
        newCourseTitle,
        newCourseDesc,
        newCourseCategory,
        xpReward,
        newCourseImage || 'https://images.unsplash.com/photo-1549490349-8643362247b5?w=400&q=80',
        newCourseLessons as Lesson[]
      );

      setIsCreateModalOpen(false);
      setNewCourseTitle('');
      setNewCourseDesc('');
      setNewCourseCategory('learning');
      setNewCourseImage('');
      setNewCourseLessons([
        { title: 'Calibration One', description: 'Initial parameters and setup.', duration: '10 min', xpReward: 50, contentMarkdown: '### Chapter 1: Foundations\n\nWelcome to your custom course lesson. Specify real-life quests here.', videoUrl: '', imageUrl: '' }
      ]);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed creating the custom course.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">

      {/* NO ACTIVE SELECTION: MAIN COURSES CATALOGUE */}
      {!selectedCourse ? (
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-indigo-400" />
              <h3 className="font-display font-bold text-base tracking-wide text-indigo-300 uppercase">
                STOIC & SCIENTIFIC PATH PROGRESSION (COURSES)
              </h3>
            </div>
            {canCreateCourse ? (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                id="open-create-course-btn"
                className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg text-white font-mono text-xs uppercase hover:opacity-95 transition-all shadow-[0_0_12px_rgba(99,102,241,0.2)] flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5" />
                CREATE CUSTOM COURSE
              </button>
            ) : (
              <div className="flex flex-col sm:items-end gap-1.5">
                <button
                  disabled
                  id="open-create-course-btn"
                  className="px-4 py-2 bg-slate-800 border border-white/10 text-slate-500 rounded-lg font-mono text-xs uppercase flex items-center gap-1.5 cursor-not-allowed shrink-0"
                  title="You need to reach level 10 to create courses."
                >
                  <Lock className="w-3.5 h-3.5" />
                  CREATE CUSTOM COURSE
                </button>
                <span className="text-[10px] text-indigo-400 font-mono">
                  You need to reach level 10 to create courses.
                </span>
              </div>
            )}
          </div>

          <p className="text-xs text-slate-400 mb-6 font-sans">
            Read comprehensive guides about real-life sleep science, compound asset development, and mental resilience. Each lesson offers actionable real-world missions that payout core character training experience points.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {courses.map((course) => {
              const progress = getCourseProgress(course.id);
              const isFinished = progress === 100;

              return (
                <div 
                  key={course.id}
                  className="rounded-xl border border-white/10 bg-white/5 overflow-hidden flex flex-col hover:border-indigo-500/30 transition-all shadow-lg"
                >
                  {/* Banner Photo */}
                  <div className="relative h-40">
                    <img
                      src={course.image}
                      alt={course.title}
                      className="w-full h-full object-cover opacity-70"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050512] via-transparent to-transparent"></div>
                    <span className="absolute top-3 right-3 text-[9px] font-mono px-2 py-0.5 rounded uppercase border border-indigo-500/20 bg-black/80 text-indigo-400">
                      {course.category}
                    </span>
                  </div>

                  {/* Body Details */}
                  <div className="p-5 flex-grow flex flex-col justify-between">
                    <div>
                      <h4 className="font-display font-medium text-sm text-slate-150 leading-snug mb-2">
                        {course.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 font-sans leading-relaxed mb-4 line-clamp-2">
                        {course.description}
                      </p>
                    </div>

                    <div>
                      {/* Progress trackers bar */}
                      <div className="mb-4">
                        <div className="flex justify-between items-center text-[10px] font-mono mb-1">
                          <span className="text-slate-500">MODULE SYNC:</span>
                          <span className={isFinished ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
                            {progress}% completed
                          </span>
                        </div>
                        <div className="w-full h-1 bg-black/40 border border-white/5 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Explore Action button */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedCourse(course)}
                          id={`explore-course-${course.id}`}
                          className="flex-grow py-2 bg-slate-900 border border-white/5 hover:border-indigo-500 hover:bg-indigo-500/10 text-slate-200 text-xs font-mono lowercase tracking-wider hover:text-indigo-400 transition-all cursor-pointer rounded-lg flex items-center justify-center gap-1.5"
                        >
                          <PlayCircle className="w-4 h-4" />
                          launch course console
                        </button>
                        {course.creatorId === user?.id && (
                          <button
                            onClick={() => {
                              setCourseToDelete(course);
                            }}
                            id={`delete-course-${course.id}`}
                            className="p-2 border border-pink-500/30 bg-pink-500/5 hover:bg-pink-500/10 hover:border-pink-505 text-pink-500 rounded-lg hover:text-pink-400 transition-all cursor-pointer flex items-center justify-center aspect-square"
                            title="Delete this custom course"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* COURSE ACTIVE SUB-WORKSPACE: SPLIT LISTS & LESSON EXPANSION READOUT */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* SATELLITE COLUMN LEFT: LESSONS TREE SELECTOR */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            
            {/* Go back banner */}
            <button
              onClick={() => { setSelectedCourse(null); setSelectedLesson(null); }}
              id="exit-module-console-btn"
              className="px-3.5 py-2 hover:bg-[#131131]/30 border border-white/10 text-left text-xs text-slate-400 font-mono uppercase hover:text-indigo-400 transition-all cursor-pointer rounded-lg"
            >
              ← RETURN TO ACADEMY CATALOGUE
            </button>

            {/* Course Information container */}
            <div className="p-5 rounded-xl border border-white/10 bg-white/5 space-y-3">
              {/* Existing course cover image: Strictly read-only image display. No upload/edit controls are shown for any existing course cover. */}
              {selectedCourse.image && (
                <div className="w-full h-32 rounded-lg overflow-hidden border border-white/5 relative">
                  <img
                    src={selectedCourse.image}
                    alt={selectedCourse.title}
                    className="w-full h-full object-cover opacity-80"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <span className="absolute bottom-2 right-2 text-[8px] font-mono tracking-widest text-slate-400 bg-black/75 px-1.5 py-0.5 rounded border border-white/10 uppercase">
                    Read-Only Cover
                  </span>
                </div>
              )}

              <div>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded uppercase border border-indigo-500/20 bg-black/60 text-indigo-400 inline-block mb-2">
                  {selectedCourse.category}
                </span>
                <h3 className="font-display font-semibold text-sm leading-snug text-slate-100 mb-2">
                  {selectedCourse.title}
                </h3>
                <p className="text-[11px] text-slate-400 leading-normal font-sans mb-3">
                  {selectedCourse.description}
                </p>
              </div>

              {/* Progress metric summaries */}
              <div className="p-3 bg-black/40 rounded-lg border border-white/5 flex justify-between items-center font-mono text-[10px]">
                <span className="text-slate-500">EXPERIENCE PAYOUT:</span>
                <span className="text-indigo-400">+{selectedCourse.xpReward} XP MODULE BONUS</span>
              </div>
            </div>

            {/* Lessons playlist selection index */}
            <div className="p-4 rounded-xl border border-white/10 bg-white/5 flex flex-col gap-2">
              <span className="text-[10px] text-slate-400 font-mono uppercase mb-1">CONTAINS {selectedCourse.lessons.length} LESSON CORES:</span>
              
              {selectedCourse.lessons.map((lesson, index) => {
                const finished = isLessonCompleted(selectedCourse.id, lesson.id);
                const isActive = selectedLesson?.id === lesson.id;

                return (
                  <button
                    key={lesson.id}
                    onClick={() => setSelectedLesson(lesson)}
                    id={`select-lesson-tab-${lesson.id}`}
                    className={`p-3 rounded-lg border text-left flex items-start justify-between gap-3 transition-all cursor-pointer ${
                      isActive 
                        ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400' 
                        : 'border-white/5 bg-black/30 text-slate-350 hover:border-white/10'
                    }`}
                  >
                    <div className="min-w-0">
                      <span className="font-mono text-[10px] text-slate-500 block">COIL 0{index + 1} • {lesson.duration}</span>
                      <span className="font-display font-medium text-xs text-slate-200 block truncate mt-0.5">{lesson.title}</span>
                    </div>
                    {finished ? (
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <PlayCircle className="w-4 h-4 text-slate-500 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* MASTER WINDOW MAIN COLUMN RIGHT: ACTIVE LESSON TEXT CONSOLE */}
          <div className="lg:col-span-8">
            {selectedLesson ? (
              <div className="p-6 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-5">
                
                {/* Heading line details */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-white/5 pb-4 gap-3">
                  <div>
                    <span className="font-mono text-[10px] text-slate-500 uppercase">ACTIVE DOCUMENT COIL</span>
                    <h2 className="font-display font-semibold text-base text-indigo-300">
                      {selectedLesson.title}
                    </h2>
                  </div>

                  <span className="font-mono text-[11px] font-bold text-indigo-400 border border-indigo-500/20 px-2.5 py-0.5 rounded bg-indigo-500/5 shrink-0">
                    +{selectedLesson.xpReward} LEARNING XP
                  </span>
                </div>

                {/* Embedded Video Player if available */}
                {selectedLesson.videoUrl && (
                  <div className="bg-black rounded-lg overflow-hidden border border-white/5 shadow-inner">
                    <video
                      src={selectedLesson.videoUrl}
                      controls
                      className="w-full max-h-80 object-contain bg-black"
                    />
                    <div className="px-3 py-1.5 bg-slate-950/60 border-t border-white/5 flex items-center justify-between">
                      <span className="text-[9.5px] font-mono text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                        <PlayCircle className="w-3.5 h-3.5" /> lesson video active
                      </span>
                    </div>
                  </div>
                )}

                {/* Embedded Lesson Photo if available */}
                {selectedLesson.imageUrl && (
                  <div className="rounded-lg overflow-hidden border border-white/5 shadow-md">
                    <img
                      src={selectedLesson.imageUrl}
                      alt={selectedLesson.title}
                      className="w-full max-h-72 object-cover"
                    />
                    <div className="px-3 py-1.5 bg-slate-950/60 border-t border-white/5">
                      <span className="text-[9.5px] font-mono text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5" /> lesson photo active
                      </span>
                    </div>
                  </div>
                )}

                {/* Main lesson content body using customizable nice retro styling */}
                <div className="space-y-4 text-xs font-sans text-slate-300 leading-relaxed pr-1 max-h-[450px] overflow-y-auto">
                  {selectedLesson.contentMarkdown ? (
                    selectedLesson.contentMarkdown.split('\n\n').map((para, pIdx) => {
                      if (para.startsWith('### ')) {
                        return <h4 key={pIdx} className="font-display font-bold text-sm text-indigo-300 pt-2">{para.replace('### ', '')}</h4>;
                      }
                      if (para.startsWith('#### ')) {
                        return <h5 key={pIdx} className="font-display font-semibold text-xs text-purple-300 pt-2 uppercase tracking-wider">{para.replace('#### ', '')}</h5>;
                      }
                      if (para.startsWith('* ') || para.startsWith('- ')) {
                        return (
                          <ul key={pIdx} className="list-disc pl-5 space-y-1.5">
                            {para.split('\n').map((li, lIdx) => (
                              <li key={lIdx}>{li.replace(/^[\*\-]\s+/, '')}</li>
                            ))}
                          </ul>
                        );
                      }
                      if (para.match(/^\d+\.\s+/)) {
                        return (
                          <ol key={pIdx} className="list-decimal pl-5 space-y-1.5">
                            {para.split('\n').map((li, lIdx) => (
                              <li key={lIdx}>{li.replace(/^\d+\.\s+/, '')}</li>
                            ))}
                          </ol>
                        );
                      }
                      return <p key={pIdx}>{para}</p>;
                    })
                  ) : (
                    <p>No document readable inside storage module.</p>
                  )}
                </div>

                {(() => {
                  const completedRecord = userLessons.find(ul => ul.courseId === selectedCourse.id && ul.lessonId === selectedLesson.id);
                  return (
                    <>
                      {/* Already Submitted Attestation Proof */}
                      {completedRecord?.proofUrl && (
                        <div className="mt-4 p-4 rounded-xl border border-emerald-500/10 bg-emerald-950/5 space-y-2">
                          <span className="text-[10px] text-emerald-400 font-mono uppercase tracking-wider block">SUBMITTED ATTESTATION PROOF</span>
                          <div className="bg-black/55 p-2 rounded border border-white/5 max-w-sm text-left">
                            {completedRecord.proofType === 'image' ? (
                              <img
                                src={completedRecord.proofUrl}
                                alt="Submitted proof payload"
                                className="max-h-36 rounded object-cover border border-white/10"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <video
                                src={completedRecord.proofUrl}
                                controls
                                className="max-h-36 w-full rounded bg-black"
                              />
                            )}
                          </div>
                        </div>
                      )}

                      {/* Proof of Work file upload section (Optional) */}
                      {!isLessonCompleted(selectedCourse.id, selectedLesson.id) && (
                        <div className="mt-4 p-4 rounded-xl border border-white/5 bg-slate-900/40 space-y-3">
                          <span className="text-[10px] text-indigo-300 font-mono uppercase tracking-wider block">UPLOAD ATTESTATION PROOF (OPTIONAL)</span>
                          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                            <label className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-white/10 rounded-lg font-mono text-xs uppercase cursor-pointer flex items-center justify-center gap-2 transition-colors shrink-0">
                              {isUploadingProof ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <Camera className="w-4 h-4" />
                              )}
                              {isUploadingProof ? 'Uploading...' : 'Select File (Img/Vid)'}
                              <input
                                type="file"
                                accept="image/png,image/jpeg,image/webp,video/mp4,video/quicktime"
                                onChange={handleProofUpload}
                                className="hidden"
                                disabled={isUploadingProof}
                              />
                            </label>
                            <div className="flex-1 text-left min-w-0">
                              {(proofPreviewUrl || proofUrl) ? (
                                <span className="text-[10px] text-emerald-400 font-mono block truncate">✓ Proof Uploaded: {proofPreviewUrl || proofUrl}</span>
                              ) : (
                                <span className="text-[10px] text-slate-500 font-sans block">Share visual feedback coefficients (screenshots, records or photo proof).</span>
                              )}
                            </div>
                          </div>
                          {proofUploadError && (
                            <p className="text-rose-400 text-[10px] font-mono mt-1">{proofUploadError}</p>
                          )}
                          {(proofPreviewUrl || proofUrl) && (
                            <div className="mt-2 text-left bg-black/55 p-2.5 rounded border border-white/5 max-w-sm relative">
                              {proofType === 'image' ? (
                                <img
                                  src={proofPreviewUrl || proofUrl}
                                  alt="Proof visual payload"
                                  className={`max-h-36 rounded object-cover border border-white/10 ${isUploadingProof ? 'opacity-40 blur-[1px]' : ''}`}
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <video
                                  src={proofPreviewUrl || proofUrl}
                                  controls={!isUploadingProof}
                                  className={`max-h-36 w-full rounded bg-black ${isUploadingProof ? 'opacity-40 blur-[1px]' : ''}`}
                                />
                              )}
                              {isUploadingProof && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/35 gap-1.5 rounded">
                                  <RefreshCw className="w-5 h-5 animate-spin text-indigo-400" />
                                  <span className="text-[8.5px] text-indigo-200 font-mono uppercase tracking-widest animate-pulse font-semibold">Uploading...</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  );
                })()}

                {/* Conquer Complete trigger bar */}
                <div className="mt-4 pt-4 border-t border-white/5 bg-black/30 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse shrink-0" />
                    <div>
                      <span className="font-display font-bold text-xs text-indigo-300 block">READY TO LEVEL UP?</span>
                      <span className="font-sans text-[10.5px] text-slate-400 block">Complete the real-life quest defined in the notes, then click complete to lock in module experience!</span>
                    </div>
                  </div>

                  <div>
                    {isLessonCompleted(selectedCourse.id, selectedLesson.id) ? (
                      <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold uppercase bg-emerald-950/20 border border-emerald-500/30 px-4 py-2 rounded-lg">
                        <CheckCircle className="w-4 h-4" />
                        conquered!
                      </div>
                    ) : (
                      <button
                        onClick={() => handleCompleteLesson(selectedCourse, selectedLesson)}
                        id="complete-lesson-reward-btn"
                        className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg text-white hover:opacity-95 text-xs font-display font-bold uppercase cursor-pointer transition-all active:scale-95 shadow-[0_0_12px_rgba(99,102,241,0.3)]"
                      >
                        CONQUER LESSON
                      </button>
                    )}
                  </div>
                </div>

              </div>
            ) : (
              <div className="p-8 rounded-xl border border-dashed border-slate-800 text-center text-slate-500 flex flex-col items-center justify-center min-h-[300px]">
                < GRADUATION_CAP_ICON />
                <p className="font-mono text-xs text-slate-400 uppercase tracking-widest">Awaiting active lesson selection...</p>
                <p className="text-[10px] text-slate-500 font-sans mt-1">Select any available file item from the course directory list on the left.</p>
              </div>
            )}
          </div>

        </div>
      )}

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#070718] p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
            
            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-indigo-400" />
                <h3 className="font-display font-bold text-base text-indigo-300 uppercase">
                  CONSTRUCT NEW DOCUMENT COIL
                </h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white font-mono text-sm uppercase cursor-pointer"
              >
                [EXIT]
              </button>
            </div>

            <form onSubmit={handleCreateCourseSubmit} className="space-y-4 text-left">
              {errorMsg && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center gap-2 text-rose-300 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Grid course parameters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-1 uppercase text-left">Course Title</label>
                  <input
                    type="text"
                    value={newCourseTitle}
                    onChange={(e) => setNewCourseTitle(e.target.value)}
                    placeholder="e.g. Financial Intelligence Tactics"
                    maxLength={100}
                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-indigo-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-1 uppercase text-left">Banner Image / Cover</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={newCourseImage}
                      onChange={(e) => setNewCourseImage(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="flex-1 bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-indigo-500 outline-none"
                    />
                    <label className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-500/30 rounded-lg font-mono text-[10px] uppercase cursor-pointer flex items-center justify-center min-w-[95px] text-center shrink-0">
                      {isUploadingImage ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        'Upload'
                      )}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={isUploadingImage}
                      />
                    </label>
                  </div>
                  {imageUploadError && (
                    <p className="text-rose-400 text-[9px] font-mono mt-1">{imageUploadError}</p>
                  )}
                  {(courseImagePreview || newCourseImage) && (
                    <div className="mt-2 text-left flex items-center gap-2">
                      <div className="relative h-10 w-20 rounded overflow-hidden border border-white/10 shrink-0 flex items-center justify-center">
                        <img
                          src={courseImagePreview || newCourseImage}
                          alt="Course Cover Preview"
                          className={`h-full w-full object-cover ${isUploadingImage ? 'opacity-45 blur-[1px]' : ''}`}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        {isUploadingImage && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                            <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                          </div>
                        )}
                      </div>
                      <span className="text-[9.5px] font-mono text-emerald-400 block">
                        {isUploadingImage ? 'Uploading image...' : '✓ Cover Image Loaded'}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-1 uppercase text-left">Thematic Skill Category</label>
                  <select
                    value={newCourseCategory}
                    onChange={(e) => setNewCourseCategory(e.target.value as TaskCategory)}
                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-indigo-500 outline-none"
                  >
                    <option value="health">Health</option>
                    <option value="fitness">Fitness</option>
                    <option value="learning">Learning</option>
                    <option value="productivity">Productivity</option>
                    <option value="finance">Finance</option>
                    <option value="mindset">Mindset</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <div className="text-[10px] text-slate-400 font-mono italic leading-snug pb-2 text-left">
                    Completing custom courses awards characters deep knowledge along with lesson experience points.
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-400 mb-1 uppercase text-left">Course Synopsis (Description)</label>
                <textarea
                  value={newCourseDesc}
                  onChange={(e) => setNewCourseDesc(e.target.value)}
                  placeholder="Master sleep systems, automate index fund investing, etc."
                  rows={2}
                  maxLength={500}
                  className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-indigo-500 outline-none resize-none"
                  required
                />
              </div>

              {/* Lessons subform */}
              <div className="border-t border-white/5 pt-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-[11px] font-mono text-indigo-400 uppercase">Lesson Core Coils ({newCourseLessons.length})</h4>
                  <button
                    type="button"
                    onClick={handleAddLesson}
                    className="text-[10.5px] font-mono text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer bg-transparent border-none"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> [+ ADD LESSON]
                  </button>
                </div>

                <div className="space-y-4 max-h-[30vh] overflow-y-auto pr-1">
                  {newCourseLessons.map((les, index) => (
                    <div key={index} className="p-3 bg-black/45 border border-white/5 rounded-lg relative space-y-3 text-left">
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-[10px] font-mono text-indigo-300">LESSON COIL #{index + 1}</span>
                        {newCourseLessons.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveLesson(index)}
                            className="text-[9px] font-mono text-rose-400 hover:text-rose-300 bg-transparent border-none"
                          >
                            [REMOVE]
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <div className="md:col-span-2">
                          <input
                            type="text"
                            value={les.title}
                            placeholder="Lesson Title (e.g. Circadian Tuning Protocols)"
                            onChange={(e) => handleLessonChange(index, 'title', e.target.value)}
                            className="w-full bg-slate-900 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white outline-none"
                            required
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            value={les.duration}
                            placeholder="Duration (e.g. 10 min)"
                            onChange={(e) => handleLessonChange(index, 'duration', e.target.value)}
                            className="w-full bg-slate-900 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white outline-none"
                            required
                          />
                        </div>
                      </div>

                      <input
                        type="text"
                        value={les.description}
                        placeholder="Brief lesson description summary"
                        onChange={(e) => handleLessonChange(index, 'description', e.target.value)}
                        className="w-full bg-slate-900 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white outline-none"
                        required
                      />

                      <div>
                        <label className="block text-[9px] font-mono text-slate-500 mb-1 text-left">LESSON MARKDOWN CONTENT & ACTIONS MISSION</label>
                        <textarea
                          value={les.contentMarkdown}
                          placeholder="Provide detailed content here in Markdown. Use ### for subheadings."
                          onChange={(e) => handleLessonChange(index, 'contentMarkdown', e.target.value)}
                          rows={3}
                          className="w-full bg-slate-900 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white font-mono outline-none"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[9px] font-mono text-slate-400 mb-1 text-left uppercase">Lesson Video File (Optional)</label>
                          <div className="flex gap-2">
                            <input
                              type="url"
                              value={les.videoUrl || ''}
                              placeholder="Video URL or upload a file"
                              onChange={(e) => handleLessonChange(index, 'videoUrl', e.target.value)}
                              className="flex-1 bg-slate-900 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white outline-none"
                            />
                            <label className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10 rounded font-mono text-[9px] uppercase cursor-pointer flex items-center justify-center min-w-[95px] text-center shrink-0">
                              {uploadingVideoIdx === index ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                              ) : (
                                'Video'
                              )}
                              <input
                                type="file"
                                accept="video/mp4,video/webm,video/quicktime"
                                onChange={(e) => handleVideoUpload(index, e)}
                                className="hidden"
                                disabled={uploadingVideoIdx !== null}
                              />
                            </label>
                          </div>
                          {videoUploadError && uploadingVideoIdx === index && (
                            <p className="text-rose-400 text-[9px] font-mono mt-1">{videoUploadError}</p>
                          )}
                          {les.videoUrl && (
                            <div className="mt-2 text-left bg-black/40 p-2 rounded border border-white/5 space-y-1">
                              <video
                                src={les.videoUrl}
                                controls
                                className="w-full max-h-32 rounded bg-black"
                                onError={(e) => {
                                  // gracefully fallback if media path is broken or initializing
                                }}
                              />
                              <span className="text-[9px] font-mono text-indigo-400 block">✓ Video Added ({les.videoUrl.startsWith('data:') ? 'Local buffer' : 'Cloud'})</span>
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-[9px] font-mono text-slate-400 mb-1 text-left uppercase">Lesson Photo (Optional)</label>
                          <div className="flex gap-2">
                            <input
                              type="url"
                              value={les.imageUrl || ''}
                              placeholder="Photo URL or upload a file"
                              onChange={(e) => handleLessonChange(index, 'imageUrl', e.target.value)}
                              className="flex-1 bg-slate-900 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white outline-none"
                            />
                            <label className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10 rounded font-mono text-[9px] uppercase cursor-pointer flex items-center justify-center min-w-[95px] text-center shrink-0">
                              {uploadingLessonImageIdx === index ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                              ) : (
                                'Photo'
                              )}
                              <input
                                type="file"
                                accept="image/png,image/jpeg,image/webp"
                                onChange={(e) => handleLessonImageUpload(index, e)}
                                className="hidden"
                                disabled={uploadingLessonImageIdx !== null}
                              />
                            </label>
                          </div>
                          {lessonImageUploadError && uploadingLessonImageIdx === index && (
                            <p className="text-rose-400 text-[9px] font-mono mt-1">{lessonImageUploadError}</p>
                          )}
                          {(lessonImagePreviews[index] || les.imageUrl) && (
                            <div className="mt-2 text-left bg-black/40 p-2 rounded border border-white/5 space-y-1">
                              <div className="relative w-full h-20 rounded overflow-hidden border border-white/5 flex items-center justify-center">
                                <img
                                  src={lessonImagePreviews[index] || les.imageUrl}
                                  alt="Lesson preview"
                                  className={`h-full w-full object-cover ${uploadingLessonImageIdx === index ? 'opacity-45 blur-[1px]' : ''}`}
                                  onError={(e) => {
                                    // gracefully fallback if media path is broken
                                  }}
                                />
                                {uploadingLessonImageIdx === index && (
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                    <RefreshCw className="w-5 h-5 animate-spin text-indigo-400" />
                                  </div>
                                )}
                              </div>
                              <span className="text-[9px] font-mono text-emerald-400 block">
                                {uploadingLessonImageIdx === index ? 'Uploading image...' : `✓ Photo Added (${(lessonImagePreviews[index] || les.imageUrl)?.startsWith('data:') ? 'Local preview' : 'Cloud'})`}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer controls */}
              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-white/10 rounded-lg text-xs font-mono uppercase text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg text-white font-mono text-xs uppercase hover:opacity-95 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'GENERATING COIL...' : 'SUBMIT NEW COURSE'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* COURSE DELETION CONFIRMATION DIALOG MODAL */}
      <AnimatePresence>
        {courseToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm rounded-xl bg-[#0a0914] border border-red-500/20 p-6 relative overflow-hidden backdrop-blur-xl shadow-2xl text-center"
            >
              <div className="flex flex-col gap-4 items-center">
                <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 animate-pulse">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-display font-semibold text-xs uppercase text-slate-100 tracking-wider">
                    DELETE COURSE SYSTEM?
                  </h3>
                  <p className="text-[11.5px] text-slate-400">
                    Are you sure you want to delete this custom course? All associated progress and data will be erased.
                  </p>
                </div>

                <div className="p-3 bg-black/40 rounded-lg border border-slate-900 w-full text-left">
                  <span className="text-[9px] font-mono text-slate-500 uppercase block mb-1">COURSE NAME:</span>
                  <p className="text-[11px] font-display font-medium text-slate-200">
                    {courseToDelete.title}
                  </p>
                </div>

                <div className="flex gap-3 w-full pt-2">
                  <button
                    onClick={() => setCourseToDelete(null)}
                    className="flex-1 px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-850 hover:border-slate-700 text-slate-400 hover:text-white rounded-lg text-xs font-mono transition-all lowercase"
                  >
                    [cancel]
                  </button>
                  <button
                    onClick={() => handleDeleteCourse(courseToDelete.id)}
                    disabled={isDeletingCourse}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 border border-red-500 text-white rounded-lg text-xs font-display font-medium transition-all uppercase disabled:opacity-50"
                  >
                    {isDeletingCourse ? 'DELETING...' : 'YES, DELETE'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

function GRADUATION_CAP_ICON() {
  return (
    <GraduationCap className="w-12 h-12 text-slate-700 mb-2 animate-bounce" />
  );
}
