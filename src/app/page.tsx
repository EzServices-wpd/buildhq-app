import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Nav */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold text-sm">
              BH
            </div>
            <span className="font-semibold text-lg tracking-tight text-slate-900">
              BuildHq
            </span>
          </div>
          <nav className="flex items-center gap-4">
            <Link
              href="/workspace"
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Workspace
            </Link>
            <Link
              href="/workspace"
              className="inline-flex items-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-700 transition"
            >
              Start Designing
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main>
        <section className="mx-auto max-w-6xl px-4 sm:px-6 pt-20 pb-24 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 max-w-3xl mx-auto leading-tight">
            Design it.{" "}
            <span className="text-brand-600">Check it.</span> Build it.
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto">
            One-stop design-to-build: measure a space, match windows and
            framing, design closets and built-ins in 3D, then get cut lists,
            materials, and assembly steps — wood, glass, and metal.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/workspace"
              className="inline-flex items-center justify-center rounded-xl bg-brand-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg hover:bg-brand-700 transition"
            >
              Open Workspace
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-8 py-3.5 text-base font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              See how it works
            </a>
          </div>
        </section>

        {/* How it works */}
        <section
          id="how-it-works"
          className="bg-slate-50 border-y border-slate-200 py-20"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">
              From idea to cut list in minutes
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold mb-4">
                  1
                </div>
                <h3 className="font-semibold text-lg text-slate-900">
                  Design in 3D
                </h3>
                <p className="mt-2 text-slate-600 text-sm leading-relaxed">
                  Start from a template or blank. Add wood or glass shelves,
                  uprights, and
                  dividers with simple controls. No CAD experience required.
                </p>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold mb-4">
                  2
                </div>
                <h3 className="font-semibold text-lg text-slate-900">
                  Help Me Build
                </h3>
                <p className="mt-2 text-slate-600 text-sm leading-relaxed">
                  One click runs structural checks, flags weak spans, and
                  suggests supports or thicker material where needed.
                </p>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold mb-4">
                  3
                </div>
                <h3 className="font-semibold text-lg text-slate-900">
                  Get the package
                </h3>
                <p className="mt-2 text-slate-600 text-sm leading-relaxed">
                  Optimized cut list, bill of materials with product search
                  terms, and step-by-step assembly instructions. Download as
                  PDF.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 text-center text-sm text-slate-500">
          <p>BuildHq MVP · Guidance only — not a substitute for professional engineering.</p>
        </footer>
      </main>
    </div>
  );
}
