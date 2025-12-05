import { NextResponse } from "next/server";
import { API_URL } from "@/app/lib/api";

type RouteParams = {
  attemptId: string;
};

export async function GET(
  request: Request,
  context: { params: Promise<RouteParams> }
) {
  try {
    const { attemptId } = await context.params;

    // Attach headers
    const headers: Record<string, string> = {};
    const auth = request.headers.get("authorization");
    const cookie = request.headers.get("cookie");
    if (auth) headers["Authorization"] = auth;
    if (cookie) headers["cookie"] = cookie;

    let attempt: any;

    // Fetch attempt from Nest API
    try {
      const res = await fetch(`${API_URL}/attempts/${attemptId}`, { headers });

      if (!res.ok) {
        return NextResponse.json(
          { message: "Attempt not found" },
          { status: 404 }
        );
      }

      const json = await res.json();

      if (!json.success || !json.data?.attempt) {
        return NextResponse.json(
          { message: "Attempt not found" },
          { status: 404 }
        );
      }

      attempt = json.data.attempt;
    } catch (err) {
      console.error("Fetch attempt error:", err);
      return NextResponse.json(
        { message: "Failed to load attempt" },
        { status: 500 }
      );
    }

    // Check completed status
    if (attempt.status !== "completed") {
      return NextResponse.json(
        { message: "This attempt is not completed yet" },
        { status: 400 }
      );
    }

    // Calculate duration
    const startTime = new Date(attempt.startedAt);
    const endTime = new Date(attempt.submittedAt);
    const duration = Math.round((endTime.getTime() - startTime.getTime()) / 1000 / 60);

    const questions = attempt.questions ?? [];
    const userAnswers = attempt.userAnswers ?? {};

    return NextResponse.json({
      attemptId: attempt.id,
      quizTitle: attempt.templateId,
      score: attempt.totalScore,
      maxScore: questions.length,
      correctCount: questions.filter((q: any) => q.isCorrect).length,
      totalQuestions: questions.length,
      percentage: attempt.percentage,
      passingScore: 0, // Optional: Fetch from template
      passed: attempt.passed,
      durationMinutes: attempt.timeSpentSeconds
        ? Math.round(attempt.timeSpentSeconds / 60)
        : duration,
      startTime: attempt.startedAt,
      endTime: attempt.submittedAt,
      questions,
      userAnswers
    });
  } catch (error: any) {
    console.error("Error in GET /api/results/[attemptId]:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error?.message },
      { status: 500 }
    );
  }
}
