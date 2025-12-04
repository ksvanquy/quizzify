import { NextResponse } from "next/server";
import { API_URL } from "@/app/lib/api";

// ==== Interfaces ==== //
export interface CategoryDto {
  id: string;
  name: string;
  slug: string;
  parentId?: number;
  icon: string;
  description?: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface QuizTemplate {
  id: string;
  name: string;
  categoryId: string;
  durationMinutes: number;
  difficulty: "easy" | "medium" | "hard";
  status: string;
}

// ==== GET ==== //
export async function GET(
  request: Request,
  context: { params: { categoryId: string } }
) {
  try {
    const { categoryId } = context.params;

    const { searchParams } = new URL(request.url);
    const includeChildren = searchParams.get("includeChildren") !== "false";
    const difficulty = searchParams.get("difficulty");
    const sortBy = (searchParams.get("sortBy") as "name" | "duration" | "difficulty") || "name";

    const headers: Record<string, string> = {};
    const auth = request.headers.get("authorization");
    const cookie = request.headers.get("cookie");
    if (auth) headers["Authorization"] = auth;
    if (cookie) headers["cookie"] = cookie;

    // ============================
    // Fetch CHILD CATEGORIES
    // ============================
    let categoryIds: string[] = [categoryId];

    if (includeChildren) {
      const categoriesRes = await fetch(`${API_URL}/categories?active=true`, { headers });
      if (categoriesRes.ok) {
        const data = await categoriesRes.json();
        const categories: CategoryDto[] = data?.data?.categories || [];

        const target = categories.find((c) => c.id === categoryId);

        if (target) {
          // children = parentId === displayOrder
          const children = categories.filter(
            (cat) => cat.parentId === target.displayOrder
          );

          categoryIds.push(...children.map((c) => c.id));
        }
      }
    }

    // ============================
    // Fetch QUIZZES
    // ============================
    const quizzesRes = await fetch(`${API_URL}/quizzes?status=active`, { headers });

    if (!quizzesRes.ok) {
      return NextResponse.json({ message: "Failed to load quizzes" }, { status: 500 });
    }

    const quizzesData = await quizzesRes.json();
    let quizzes: QuizTemplate[] = quizzesData?.data?.quizzes || [];

    // Filter by categoryIds
    quizzes = quizzes.filter((q) => categoryIds.includes(q.categoryId));

    // Filter difficulty
    if (difficulty) {
      quizzes = quizzes.filter((q) => q.difficulty === difficulty);
    }

    // ============================
    // Sorting
    // ============================
    quizzes.sort((a, b) => {
      switch (sortBy) {
        case "duration":
          return a.durationMinutes - b.durationMinutes;

        case "difficulty":
          const diffOrder = { easy: 1, medium: 2, hard: 3 };
          return diffOrder[a.difficulty] - diffOrder[b.difficulty];

        default:
          return a.name.localeCompare(b.name);
      }
    });

    return NextResponse.json({
      success: true,
      quizzes,
      total: quizzes.length,
    });
  } catch (error: any) {
    console.error("Error in GET /api/categories/[categoryId]/quizzes:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}
