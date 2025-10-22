import { HomeLayout } from "fumadocs-ui/layouts/home";
import { BookOpen, Heart } from "lucide-react";
import type { ReactNode } from "react";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <HomeLayout
      githubUrl="https://github.com/fuma-nama/fuma-comment"
      nav={{
        title: "Fuma Comment",
      }}
      links={[
        {
          url: "/docs",
          text: "Docs",
          icon: <BookOpen />,
        },
        {
          url: "/sponsors",
          text: "Sponsors",
          icon: <Heart />,
        },
      ]}
    >
      <div className="mx-auto w-full max-w-[1000px] py-12 px-4">{children}</div>
    </HomeLayout>
  );
}
