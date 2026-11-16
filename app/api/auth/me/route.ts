import { NextRequest, NextResponse } from "next/server";
import { getCurrentMember } from "@/lib/auth/dal";
import { errorStatus } from "@/lib/sheets/core";
import { updateOwnName } from "@/lib/team-store";

export async function GET() {
  try {
    const member = await getCurrentMember();
    return NextResponse.json({ success: true, member });
  } catch {
    return NextResponse.json({ success: false, member: null });
  }
}

// Changes the signed-in person's own name, and nothing else.
export async function PUT(req: NextRequest) {
  try {
    const member = await getCurrentMember();
    const body = await req.json().catch(() => ({}));
    await updateOwnName(member, body.name);
    return NextResponse.json({ success: true, member: await getCurrentMember() });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update your name" },
      { status: errorStatus(error) }
    );
  }
}
