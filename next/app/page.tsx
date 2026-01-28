export default function Home() {
  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: "2rem",
      }}
    >
      <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>
        Welcome to Next.js
      </h1>
      <p style={{ color: "#666", fontSize: "1.125rem" }}>
        Get started by editing <code>app/page.tsx</code>
      </p>
    </main>
  );
}
