import NextAuth from "next-auth";
import { authOptions } from "./options";

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- external library
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
