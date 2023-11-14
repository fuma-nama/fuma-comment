import { NextResponse } from "next/server";

export const NOT_AUTHENTICATED = NextResponse.json(
  { message: "Not Authenticated" },
  { status: 401 }
);
