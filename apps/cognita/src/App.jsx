import BrandLockup from '@/components/BrandLockup';

const FMB_COMPANY_URL = 'https://www.francinemariebautista.com/fmbandco/';
const FMB_CONTACT_URL = 'https://www.francinemariebautista.com/aboutfmb/#work-with-fmb';

function App() {
  return (
    <div className="min-h-screen overflow-hidden bg-[#050914] text-slate-100">
      <a
        className="fixed left-4 top-4 z-50 -translate-y-24 rounded-full bg-sky-300 px-4 py-2 text-sm font-semibold text-slate-950 transition focus:translate-y-0"
        href="#main-content"
      >
        Skip to main content
      </a>

      <div className="pointer-events-none fixed inset-0" aria-hidden="true">
        <div className="absolute left-1/2 top-[-18rem] h-[38rem] w-[38rem] -translate-x-1/2 rounded-full bg-sky-400/10 blur-3xl" />
        <div className="absolute bottom-[-18rem] right-[-12rem] h-[34rem] w-[34rem] rounded-full bg-indigo-500/10 blur-3xl" />
      </div>

      <header className="relative z-10 border-b border-white/10">
        <div className="mx-auto flex min-h-24 w-full max-w-6xl items-center justify-between gap-5 px-5 py-5 sm:px-8">
          <a href="/" aria-label="Cognita home">
            <BrandLockup size="sm" />
          </a>
          <a
            className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white/80 transition hover:border-sky-300/40 hover:text-white"
            href={FMB_COMPANY_URL}
          >
            FMB&amp;CO.
          </a>
        </div>
      </header>

      <main className="relative z-10" id="main-content">
        <section className="mx-auto grid min-h-[calc(100vh-12rem)] w-full max-w-6xl items-center gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1.15fr_.85fr] lg:py-24">
          <div>
            <p className="mb-6 text-xs font-semibold uppercase tracking-[0.22em] text-sky-300/80">
              An FMB&amp;CO. company
            </p>
            <h1 className="max-w-3xl font-display text-5xl font-light leading-[1.02] tracking-[-0.04em] text-white sm:text-7xl">
              Knowledge for what comes next.
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
              Cognita is the knowledge and learning arm of FMB&amp;CO.
            </p>
            <p className="mt-5 max-w-2xl leading-7 text-slate-400">
              Current public information is being reviewed. No public registration,
              paid enrollment, course, credential, or accreditation claim is active
              on this website.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <a
                className="apple-button-primary min-h-12 px-6 text-sm font-semibold"
                href={FMB_COMPANY_URL}
              >
                Visit FMB&amp;CO.
              </a>
              <a
                className="apple-button-secondary min-h-12 px-6 text-sm font-semibold"
                href={FMB_CONTACT_URL}
              >
                Contact FMB
              </a>
            </div>
          </div>

          <aside className="apple-card p-7 sm:p-9" aria-labelledby="status-title">
            <p className="apple-eyebrow">Publication status</p>
            <h2 className="mt-4 text-2xl font-semibold text-white" id="status-title">
              Only verified information is published.
            </h2>
            <p className="mt-4 leading-7 text-slate-400">
              Cognita’s public role is limited here to knowledge and learning within
              FMB&amp;CO. Details will appear only after they are approved for release.
            </p>
            <dl className="mt-8 divide-y divide-white/10 border-y border-white/10">
              <div className="flex items-center justify-between gap-4 py-4">
                <dt className="text-sm text-slate-400">Registration</dt>
                <dd className="text-sm font-semibold text-white">Closed</dd>
              </div>
              <div className="flex items-center justify-between gap-4 py-4">
                <dt className="text-sm text-slate-400">Paid offers</dt>
                <dd className="text-sm font-semibold text-white">None published</dd>
              </div>
              <div className="flex items-center justify-between gap-4 py-4">
                <dt className="text-sm text-slate-400">Credentials</dt>
                <dd className="text-sm font-semibold text-white">None published</dd>
              </div>
            </dl>
          </aside>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/10">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-5 py-7 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <span>© {new Date().getFullYear()} Cognita.</span>
          <span>Knowledge and learning within FMB&amp;CO.</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
