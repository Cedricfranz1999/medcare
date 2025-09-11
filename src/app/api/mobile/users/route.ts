import { NextResponse } from "next/server";
import { prisma } from "~/lib/prisma";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: Request, { params }: Params) {
  try {
    const resolvedParams = await params;
    const user = await prisma.user.findUnique({
      where: { id: parseInt(resolvedParams.id) },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 },
    );
  }
}
