import { CommentsWithAuth } from "./page.client";

export default function Page(): JSX.Element {
  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        maxWidth: "1200px",
        margin: "40px auto",
      }}
    >
      <CommentsWithAuth />
    </main>
  );
}
