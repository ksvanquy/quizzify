// app/api/categories/route.ts

import { NextResponse } from "next/server";
import { API_URL } from "@/app/lib/api";

// ==== Interface Types ==== //
export interface Category {
  id: string;
  _id?: string;
  name: string;
  parentId: string | null;
  isActive: boolean;
  displayOrder: number;
  children?: Category[];
}

export interface QuizTemplate {
  id: string;
  _id?: string;
  categoryId: string;
  status: string;
}

// ==== Build Tree ==== //
function buildCategoryTree(categories: Category[], parentId: string | null = null): Category[] {
  return categories
    .filter((cat) => cat.parentId === parentId && cat.isActive)
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((cat) => ({
      ...cat,
      children: buildCategoryTree(categories, cat.id),
    }));
}

// ==== Count Quizzes ==== //
function countQuizzesInCategory(
  categoryId: string,
  categories: Category[],
  quizTemplates: QuizTemplate[]
): { count: number; ids: string[] } {
  const childIds = categories.filter((c) => c.parentId === categoryId).map((c) => c.id);

  const allCategoryIds = [
    categoryId,
    ...childIds.flatMap((id) => [id, ...countQuizzesInCategory(id, categories, quizTemplates).ids]),
  ];

  const count = quizTemplates.filter(
    (quiz) => allCategoryIds.includes(quiz.categoryId) && quiz.status === "active"
  ).length;

  return { count, ids: childIds };
}

// ==== GET API ==== //
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const format = (searchParams.get("format") as "tree" | "flat") || "tree";
    const includeStats = searchParams.get("includeStats") === "true";

    let categories: Category[] = [];
    let quizTemplates: QuizTemplate[] = [];

    try {
      const headers: Record<string, string> = {};
      const auth = request.headers.get("authorization");
      const cookie = request.headers.get("cookie");

      if (auth) headers["Authorization"] = auth;
      if (cookie) headers["cookie"] = cookie;

      // Fetch Categories
      const categoriesRes = await fetch(`${API_URL}/categories?active=true`, { headers });
      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        categories = categoriesData?.data?.categories || [];
      }

      // Fetch Quizzes (if needed)
      if (includeStats) {
        const quizzesRes = await fetch(`${API_URL}/quizzes?status=active`, { headers });
        if (quizzesRes.ok) {
          const quizzesData = await quizzesRes.json();
          quizTemplates = quizzesData?.data?.quizzes || [];
        }
      }
    } catch (error) {
      console.error("Error fetching from API:", error);
      return NextResponse.json({ message: "Failed to load categories" }, { status: 500 });
    }

    // ============================
    // FORMAT: TREE
    // ============================
    if (format === "tree") {
      const tree = buildCategoryTree(categories);

      if (includeStats) {
        const addStats = (nodes: Category[]): Category[] =>
          nodes.map((node) => {
            const catId = String(node.id || node._id);
            const quizCount = quizTemplates.filter((q) => String(q.categoryId) === catId).length;

            return {
              ...node,
              quizCount,
              children: node.children ? addStats(node.children) : [],
            } as any;
          });

        return NextResponse.json({
          success: true,
          data: { categories: addStats(tree) },
        });
      }

      return NextResponse.json({
        success: true,
        data: { categories: tree },
      });
    }

    // ============================
    // FORMAT: FLAT LIST
    // ============================
    const activeCategories = categories
      .filter((cat) => cat.isActive)
      .sort((a, b) => a.displayOrder - b.displayOrder);

    if (includeStats) {
      const withStats = activeCategories.map((cat) => {
        const catId = String(cat.id || cat._id);
        const quizCount = quizTemplates.filter((q) => String(q.categoryId) === catId).length;

        return { ...cat, quizCount };
      });

      return NextResponse.json({
        success: true,
        data: { categories: withStats },
      });
    }

    return NextResponse.json({
      success: true,
      data: { categories: activeCategories },
    });
  } catch (error: any) {
    console.error("Error in GET /api/categories:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}
