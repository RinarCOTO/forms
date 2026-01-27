"use client";

import Link from 'next/link';

export default function Home() {

  return (
    <main className="min-h-screen flex flex-col gap-8 p-8 bg-zinc-50 font-sans dark:bg-black">
      <header className="flex flex-col gap-2 max-w-5xl">
        <h1 className="text-2xl font-bold">Real Property Forms Portal</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Select a form to fill up, then open the corresponding print-ready RPFAAS page.
        </p>
      </header>

      {/* Quick Access to RPFAAS Dashboard */}
      <section className="max-w-5xl">
        <Link
          href="/rpfaas"
          className="block border-2 border-blue-500 rounded-lg p-6 bg-linear-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-blue-900 dark:text-blue-100">
                📋 RPFAAS Forms Dashboard
              </h2>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
                Access all Real Property Field Appraisal & Assessment Sheets in one place.
                Choose from Building/Structure, Land/Improvements, or Machinery forms.
              </p>
            </div>
            <div className="text-blue-600 dark:text-blue-400 text-3xl">→</div>
          </div>
        </Link>
      </section>

      <section className="grid gap-4 md:grid-cols-3 max-w-5xl">
        {/* Building & Other Structures */}
        <div className="border rounded-lg p-4 flex flex-col justify-between gap-3 bg-white dark:bg-zinc-900">
          <div>
            <h2 className="font-semibold">RPFAAS - Building &amp; Other Structures</h2>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Fill up details for buildings and other structures, then generate a print-ready assessment sheet.
            </p>
          </div>
          <div className="flex gap-3 mt-2">
            <Link
              href="/rpfaas/building-structure/fill"
              className="text-sm px-3 py-1.5 rounded bg-blue-600 text-white text-center flex-1"
            >
              Fill up form
            </Link>
            <Link
              href="/rpfaas/building-structure/view"
              className="text-sm px-3 py-1.5 rounded border border-gray-300 text-center flex-1"
            >
              Print preview
            </Link>
          </div>
        </div>

        {/* Land / Other Improvements */}
        <div className="border rounded-lg p-4 flex flex-col justify-between gap-3 bg-white dark:bg-zinc-900">
          <div>
            <h2 className="font-semibold">RPFAAS - Land / Other Improvements</h2>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Work with land and other improvements assessment sheets.
            </p>
          </div>
          <div className="flex gap-3 mt-2">
            <Link
              href="/rpfaas/land-improvements/view"
              className="text-sm px-3 py-1.5 rounded border border-gray-300 text-center flex-1"
            >
              View form
            </Link>
          </div>
        </div>

        {/* Notes / Misc */}
        <div className="border rounded-lg p-4 flex flex-col justify-between gap-3 bg-white dark:bg-zinc-900">
          <div>
            <h2 className="font-semibold">Notes &amp; References</h2>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Keep internal notes or references related to assessments.
            </p>
          </div>
          <div className="flex gap-3 mt-2">
            <Link
              href="/notes"
              className="text-sm px-3 py-1.5 rounded border border-gray-300 text-center flex-1"
            >
              Open notes
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
