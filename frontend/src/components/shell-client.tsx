"use client";

import { usePathname } from "next/navigation";
import { TopBar } from "./top-bar";
import { UselessFooter } from "./useless-footer";

export function ShellClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuth = pathname === "/login" || pathname === "/register";
  const isBattle = /^\/match\/[^/]+$/.test(pathname);
  const showShell = !isAuth && !isBattle;

  if (isAuth) {
    return (
      <>
        <div className="app-bg" />
        <div className="shell">{children}</div>
      </>
    );
  }

  return (
    <>
      <div className="app-bg" />
      <div className="shell">
        {showShell && <TopBar />}
        {children}
        {showShell && <UselessFooter />}
      </div>
    </>
  );
}
