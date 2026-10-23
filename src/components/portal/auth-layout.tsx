import type { ReactNode } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDemo } from "@/lib/demo-store";

/** Shared frame for sign-in, password reset and first-admin setup screens. */
export function AuthLayout({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  const { theme, setTheme } = useDemo();
  return (
    <div className="relative min-h-screen bg-background">
      <div className="absolute right-4 top-4">
        <Button variant="ghost" size="icon" aria-label="Toggle theme" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
          {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </Button>
      </div>
      <div className={aside ? "mx-auto grid min-h-screen max-w-6xl items-center gap-12 px-6 py-16 lg:grid-cols-[1.1fr_1fr]" : "mx-auto flex min-h-screen max-w-md items-center px-6 py-16"}>
        {aside}
        <div className="w-full">{children}</div>
      </div>
    </div>
  );
}

export function FieldError({ msg }: { msg?: string | undefined }) {
  return msg ? <p className="mt-1 text-xs text-destructive">{msg}</p> : null;
}

export function FormAlert({ msg, tone = "error" }: { msg?: string | null | undefined; tone?: "error" | "info" }) {
  if (!msg) return null;
  return (
    <div role="alert" className={tone === "error" ? "rounded-lg border border-destructive/30 bg-danger-soft px-3 py-2 text-sm text-destructive" : "rounded-lg border border-info/30 bg-info-soft px-3 py-2 text-sm text-info"}>
      {msg}
    </div>
  );
}
