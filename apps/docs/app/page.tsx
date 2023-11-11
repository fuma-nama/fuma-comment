import { Comments } from "ui";

export default function Page(): JSX.Element {
  return (
    <main
      className="dark"
      style={{
        display: "flex",
        flexDirection: "column",
        maxWidth: "1200px",
        margin: "40px auto",
      }}
    >
      <Comments />
    </main>
  );
}
