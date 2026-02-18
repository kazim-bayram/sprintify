"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Kanban, GanttChart } from "lucide-react";

type View = "agile" | "waterfall";

export function MethodologySwitcher() {
  const [view, setView] = useState<View>("agile");

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Toggle */}
      <div className="flex justify-center mb-4">
        <div
          role="tablist"
          aria-label="Switch between Agile and Waterfall view"
          className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1 shadow-sm"
        >
          <button
            type="button"
            role="tab"
            aria-selected={view === "agile"}
            onClick={() => setView("agile")}
            className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              view === "agile"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Kanban className="h-4 w-4" strokeWidth={1.5} />
            Agile View
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === "waterfall"}
            onClick={() => setView("waterfall")}
            className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              view === "waterfall"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <GanttChart className="h-4 w-4" strokeWidth={1.5} />
            Waterfall View
          </button>
        </div>
      </div>

      {/* Browser-style container */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-gray-200 bg-gray-50 px-4 py-3">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-gray-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-gray-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-gray-300" />
          </div>
          <span className="ml-2 text-xs text-gray-500">Sprintify</span>
        </div>

        <div className="min-h-[280px] bg-gray-50/50 p-4 sm:min-h-[320px] sm:p-5">
          <AnimatePresence mode="wait">
            {view === "agile" ? (
              <motion.div
                key="agile"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.2 }}
                className="grid h-full grid-cols-3 gap-3"
              >
                {["To Do", "In Progress", "Done"].map((col, i) => (
                  <div
                    key={col}
                    className="flex flex-col rounded-lg border border-gray-200 bg-white p-3 shadow-sm"
                  >
                    <p className="mb-3 text-xs font-medium text-gray-500">{col}</p>
                    <div className="space-y-2 flex-1">
                      {col === "To Do" && (
                        <>
                          <div className="rounded border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 shadow-sm">
                            Implement login flow
                          </div>
                          <div className="rounded border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 shadow-sm">
                            Add validation
                          </div>
                        </>
                      )}
                      {col === "In Progress" && (
                        <div className="rounded border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 shadow-sm">
                          API integration
                        </div>
                      )}
                      {col === "Done" && (
                        <div className="rounded border border-gray-200 bg-white px-3 py-2 text-xs text-gray-500 shadow-sm">
                          Setup project
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="waterfall"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
                className="flex h-full flex-col"
              >
                <div className="mb-3 flex gap-2 text-xs text-gray-500">
                  <span className="w-20 shrink-0">Phase</span>
                  <span className="flex-1">Timeline</span>
                </div>
                <div className="space-y-3 flex-1">
                  {[
                    { label: "Discovery", width: "25%" },
                    { label: "Development", width: "50%" },
                    { label: "Launch", width: "15%" },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center gap-3">
                      <span className="w-20 shrink-0 text-xs font-medium text-gray-700">
                        {row.label}
                      </span>
                      <div className="h-8 flex-1 overflow-hidden rounded border border-gray-200 bg-white shadow-sm">
                        <div
                          className="h-full rounded-sm bg-gray-700"
                          style={{ width: row.width }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex gap-1 border-t border-gray-200 pt-3">
                  {["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map((m) => (
                    <span key={m} className="flex-1 text-center text-[10px] text-gray-400">
                      {m}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
