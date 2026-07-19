import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Loader2, ArrowLeft, CheckCircle, XCircle, Trophy, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

export default function StudentQuiz() {
  const { week } = useParams();
  const weekNum = parseInt(week);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [student, setStudent] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const load = async () => {
    const user = await base44.auth.me();
    const students = await base44.entities.Student.filter({ email: user.email });
    if (students.length > 0) {
      const s = students[0];
      setStudent(s);
      const lessons = await base44.entities.Quiz.filter({ week_number: weekNum });
      const trackMatch = lessons.find(q => q.track === s.track);
      const foundationMatch = lessons.find(q => !q.track);
      setQuiz(trackMatch || foundationMatch || null);
      const allAttempts = await base44.entities.QuizAttempt.filter({ student_id: s.id, week_number: weekNum });
      setAttempts(allAttempts.sort((a, b) => b.attempt_number - a.attempt_number));
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [weekNum]);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-muted-foreground" size={24} /></div>;

  if (!student) return <div className="text-center py-20 text-muted-foreground">Not enrolled yet.</div>;

  if (!quiz || quiz.status !== "Published") {
    return (
      <div className="text-center py-20">
        <p className="text-sm text-muted-foreground">No quiz available for Week {weekNum}.</p>
        <Link to="/student/program" className="text-xs text-cyan-400 hover:underline mt-2 inline-block">← Back to Program</Link>
      </div>
    );
  }

  const bestAttempt = attempts[0];
  const hasPassed = attempts.some(a => a.passed);

  const handleSubmit = async () => {
    const totalQuestions = quiz.questions.length;
    let correct = 0;
    const answerDetails = [];

    quiz.questions.forEach((q, i) => {
      const selected = answers[i];
      const isCorrect = selected === q.correct_answer_index;
      if (isCorrect) correct++;
      answerDetails.push({
        question_text: q.question_text,
        selected_index: selected ?? -1,
        correct_index: q.correct_answer_index,
        is_correct: isCorrect,
      });
    });

    const scorePercent = Math.round((correct / totalQuestions) * 100);
    const passed = scorePercent >= (quiz.passing_score_percent || 70);

    setSubmitting(true);
    try {
      await base44.entities.QuizAttempt.create({
        quiz_id: quiz.id,
        student_id: student.id,
        student_name: student.full_name,
        week_number: weekNum,
        score_percent: scorePercent,
        passed,
        answers: answerDetails,
        attempt_number: (attempts[0]?.attempt_number || 0) + 1,
      });
      setResult({ scorePercent, correct, total: totalQuestions, passed, details: answerDetails });
      toast({ title: passed ? "Quiz passed!" : "Quiz completed", description: `Score: ${scorePercent}%` });
      load();
    } catch (err) {
      toast({ title: "Submission failed", description: err.message, variant: "destructive" });
    }
    setSubmitting(false);
  };

  // Show result
  if (result) {
    return (
      <div>
        <Link to="/student/program" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft size={14} /> Back to Program
        </Link>
        <div className={`rounded-xl border p-8 text-center mb-6 ${result.passed ? "border-emerald-500/20 bg-emerald-500/5" : "border-orange-500/20 bg-orange-500/5"}`}>
          {result.passed ? <CheckCircle size={40} className="text-emerald-400 mx-auto mb-4" /> : <XCircle size={40} className="text-orange-400 mx-auto mb-4" />}
          <h1 className="text-2xl font-heading font-bold mb-2">{result.passed ? "Passed!" : "Not Passed Yet"}</h1>
          <p className="text-sm text-muted-foreground mb-1">You scored {result.scorePercent}% ({result.correct}/{result.total} correct)</p>
          <p className="text-xs text-muted-foreground">Passing score: {quiz.passing_score_percent || 70}%</p>
        </div>

        {/* Answer review */}
        <div className="space-y-3 mb-6">
          {result.details.map((detail, i) => (
            <div key={i} className={`rounded-xl border p-4 ${detail.is_correct ? "border-emerald-500/20 bg-emerald-500/5" : "border-red-500/20 bg-red-500/5"}`}>
              <div className="flex items-start gap-2 mb-2">
                {detail.is_correct ? <CheckCircle size={14} className="text-emerald-400 mt-0.5 flex-shrink-0" /> : <XCircle size={14} className="text-red-400 mt-0.5 flex-shrink-0" />}
                <p className="text-sm font-medium">{detail.question_text}</p>
              </div>
              <p className="text-xs text-muted-foreground ml-6">
                Your answer: <span className={detail.is_correct ? "text-emerald-400" : "text-red-400"}>{detail.selected_index >= 0 ? quiz.questions[i].options[detail.selected_index] : "No answer"}</span>
              </p>
              {!detail.is_correct && (
                <p className="text-xs text-emerald-400 ml-6 mt-1">Correct answer: {quiz.questions[i].options[detail.correct_index]}</p>
              )}
              {quiz.questions[i].explanation && (
                <p className="text-xs text-muted-foreground ml-6 mt-1 italic">{quiz.questions[i].explanation}</p>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          {!result.passed && (
            <Button onClick={() => { setResult(null); setAnswers({}); }} variant="outline" className="border-border">
              <RotateCcw size={14} className="mr-2" /> Retake Quiz
            </Button>
          )}
          <Button onClick={() => navigate("/student/program")} className="bg-cyan-500 text-black hover:bg-cyan-400">
            Back to Program
          </Button>
        </div>
      </div>
    );
  }

  // Show quiz
  return (
    <div>
      <Link to="/student/program" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4">
        <ArrowLeft size={14} /> Back to Program
      </Link>

      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-heading font-bold mb-1">{quiz.title}</h1>
        {quiz.description && <p className="text-sm text-muted-foreground">{quiz.description}</p>}
        <p className="text-xs text-muted-foreground mt-2">Passing score: {quiz.passing_score_percent || 70}% · Week {weekNum}</p>
      </div>

      {hasPassed && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 mb-6 flex items-center gap-2">
          <Trophy size={16} className="text-emerald-400" />
          <p className="text-sm text-emerald-400">You've already passed this quiz (best: {bestAttempt.score_percent}%).</p>
        </div>
      )}

      <div className="space-y-4 mb-6">
        {quiz.questions.map((q, qIdx) => (
          <div key={qIdx} className="rounded-xl border border-border/50 bg-card p-5">
            <p className="text-sm font-medium mb-3">{qIdx + 1}. {q.question_text}</p>
            <div className="space-y-2">
              {q.options.map((opt, optIdx) => (
                <button
                  key={optIdx}
                  onClick={() => setAnswers(a => ({ ...a, [qIdx]: optIdx }))}
                  className={`flex items-center gap-2 w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-colors ${
                    answers[qIdx] === optIdx
                      ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-400"
                      : "border-border/50 bg-secondary/30 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border flex-shrink-0 ${answers[qIdx] === optIdx ? "border-cyan-400 bg-cyan-400" : "border-muted-foreground/30"}`} />
                  {opt}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Button
        onClick={handleSubmit}
        disabled={Object.keys(answers).length < quiz.questions.length || submitting}
        className="w-full bg-cyan-500 text-black hover:bg-cyan-400 h-12"
      >
        {submitting ? <Loader2 size={16} className="animate-spin" /> : "Submit Quiz"}
      </Button>
    </div>
  );
}