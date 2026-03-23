import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function LandingPage() {
  const navItems = ["Program", "Model", "Platform", "Cities"];
  const partnerNames = [
    "Chennai Classrooms",
    "Trichy Schools",
    "Coimbatore Network",
    "Low-Income Private",
    "Aided Schools",
    "Corporation Schools",
  ];

  const roleLinks = [
    { label: "Teacher Login", path: "/teacher/login" },
    { label: "Admin Login", path: "/admin/login" },
    { label: "Student Login", path: "/student/login" },
    { label: "Parent Login", path: "/parent/login" },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute h-[80vh] w-[50vw] bg-primary/20 blur-3xl" />
        <div className="absolute -right-40 top-[10%] h-[20rem] w-[34rem] rounded-full bg-primary/30 blur-3xl" />
        <div className="absolute bottom-[-14rem] right-[1%] h-[36rem] w-[36rem] rounded-full bg-primary/20 blur-3xl" />
      </div>

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md">
            <img src="/customized.png" alt="CustomizEd Logo" className="h-full w-full rounded-sm object-cover" />
          </div>
          <span className="font-display text-lg font-semibold text-foreground">CustomizEd</span>
        </div>

        <nav className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => (
            <a key={item} href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              {item}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link to="/teacher/login" className="text-sm text-muted-foreground hover:text-foreground">
            Log In
          </Link>
          <Link to="/teacher/login" className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background">
            Explore Demo
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-20 pt-6 lg:px-8">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", duration: 0.5, bounce: 0 }}
          className="mx-auto max-w-4xl text-center"
        >
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
            Bhumi Fellowship
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-[1.05] text-foreground sm:text-5xl lg:text-6xl">
            Bridging learning gaps with focused classroom action.
          </h1>
          <p className="mx-auto mt-5 max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            A program supporting corporation, aided, and low-income private schools across Chennai, Trichy, and Coimbatore through customized kits, Choice Learning Station pedagogy, and a teacher-first digital planning platform.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/teacher/login" className="rounded-full border border-border bg-background px-6 py-2.5 text-sm font-medium text-foreground">
              Teacher Workspace
            </Link>
            <Link to="/student/login" className="rounded-full bg-foreground px-6 py-2.5 text-sm font-medium text-background">
              Student Dashboard
            </Link>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-2 text-center text-xs text-muted-foreground sm:grid-cols-3 lg:grid-cols-6">
            {partnerNames.map((name) => (
              <span key={name} className="py-1">{name}</span>
            ))}
          </div>
        </motion.section>

        <section className="mt-10 border-y border-border">
          <div className="flex flex-wrap items-center justify-center divide-x divide-border text-sm text-muted-foreground">
            <div className="px-6 py-3 text-foreground">Customized Kit</div>
            <div className="px-6 py-3 text-foreground">CLS</div>
            <div className="px-6 py-3 text-foreground">Platform</div>
            <div className="px-6 py-3 text-foreground">Outcomes</div>
          </div>
        </section>

        <section className="bg-[linear-gradient(145deg,hsl(var(--muted)/0.35),hsl(var(--background)))] px-4 py-8 sm:px-8">
          <div className="mx-auto max-w-5xl border border-border bg-background">
            <div className="grid min-h-[360px] gap-0 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="border-b border-border p-6 lg:border-b-0 lg:border-r">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Instruction Engine</p>
                <h2 className="mt-2 text-2xl font-semibold text-foreground">From profile to plan in one flow</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Teachers view student profiles by rigor level and Choice Learning Station preference, then create targeted bilingual lesson plans with drag-and-drop resources.
                </p>
                <div className="mt-6 space-y-3 text-sm text-foreground">
                  <p>1. Customized Kit: Tiered physical materials by rigor, including bilingual charts, cartoon notebooks, trackers, sand clocks, rhymes, and songs.</p>
                  <p>2. CLS: Learning preference pathways for Visual, Auditory, Kinesthetic, and Reading/Writing modes with peer, group, and individual strategies.</p>
                  <p>3. Website Platform: Planning tools, progress tracker, and resource library for consistent classroom execution.</p>
                </div>
              </div>

              <div className="p-6">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">CLS Mapping</p>
                <ul className="mt-3 space-y-3 text-sm leading-relaxed text-foreground">
                  <li><span className="font-medium">Visual:</span> charts, drawing books</li>
                  <li><span className="font-medium">Auditory:</span> songs, dramas</li>
                  <li><span className="font-medium">Kinesthetic:</span> game boards, manipulatives</li>
                  <li><span className="font-medium">Reading/Writing:</span> worksheets, stories</li>
                </ul>
                <div className="mt-6 border-t border-border pt-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Learning formats</p>
                  <p className="mt-2 text-sm text-foreground">Peer Learning, Group Learning, Individual Learning</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto mt-14 max-w-4xl text-center">
          <h3 className="text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
            One ecosystem for planning, delivery, and progress.
          </h3>
          <p className="mx-auto mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground">
            The platform helps teachers translate diagnostics into focused classroom action, while administrators and families stay aligned on student growth.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {roleLinks.map((role) => (
              <Link
                key={role.label}
                to={role.path}
                className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-foreground transition-colors hover:bg-muted"
              >
                {role.label}
                <ArrowRight size={14} />
              </Link>
            ))}
          </div>
        </section>
      </main>

      <footer className="relative z-10 mx-auto w-full max-w-6xl px-6 py-6 text-center text-sm text-muted-foreground lg:px-8">
        © 2026 CustomizEd · Built to support Bhumi Fellowship classrooms
      </footer>
    </div>
  );
}
