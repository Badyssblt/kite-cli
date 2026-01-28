import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SignOutButton } from "./sign-out-button";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="dashboard-container">
      <h1>Dashboard</h1>

      <div className="session-info">
        <h2>Session</h2>
        <pre>{JSON.stringify(session, null, 2)}</pre>
      </div>

      <SignOutButton />

      <style>{`
        .dashboard-container {
          max-width: 800px;
          margin: 2rem auto;
          padding: 2rem;
        }
        .session-info {
          background: #f5f5f5;
          padding: 1rem;
          border-radius: 8px;
          margin: 1rem 0;
        }
        pre {
          overflow: auto;
          font-size: 0.875rem;
        }
      `}</style>
    </div>
  );
}
