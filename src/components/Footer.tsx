import { Github } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="w-full py-6 mt-auto border-t border-border/50">
      <div className="container mx-auto px-4">
        <p className="text-center text-sm text-muted-foreground">
          © 2025 Developed by{" "}
          <a
            href="https://github.com/CodeWithTanim"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-foreground hover:text-primary transition-colors"
          >
            <Github className="w-3 h-3" />
            CodeWithTanim
          </a>
          {" "}&{" "}
          <a
            href="https://github.com/amit-hasan10"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-foreground hover:text-primary transition-colors"
          >
            <Github className="w-3 h-3" />
            amit-hasan10
          </a>
        </p>
      </div>
    </footer>
  );
};
