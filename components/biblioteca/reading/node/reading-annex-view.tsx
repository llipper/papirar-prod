"use client"

import React from "react"
import type { LawReading } from "@/lib/biblioteca/reading-service"

export function ReadingAnnexView({
  annex,
}: {
  annex: NonNullable<LawReading["annexes"]>[number]
}) {
  const isMatrix = annex.rows.some((row) => row.columns.length > 0)
  const matrixHeaders = [annex.leftHeader, annex.rightHeader]
  const matrixColumnCount = Math.max(
    2,
    ...annex.rows.map((row) => row.columns.length)
  )
  if (isMatrix) {
    matrixHeaders.length = matrixColumnCount
    matrixHeaders[0] = "Círculo"
    matrixHeaders[1] = "Hierarquização"
    matrixHeaders[2] = "Posto / Graduação"
    matrixHeaders[3] = "Marinha"
    matrixHeaders[4] = "Exército"
    matrixHeaders[5] = "Aeronáutica"
  }

  return (
    <section
      className="mt-14 space-y-4 pb-10"
      aria-labelledby={`annex-${annex.annexKey}`}
    >
      <div className="space-y-1 text-center">
        <h2
          id={`annex-${annex.annexKey}`}
          className="font-display text-base font-semibold uppercase"
        >
          {annex.title}
        </h2>
        {annex.subtitle && (
          <p className="font-display text-sm font-semibold uppercase">
            {annex.subtitle}
          </p>
        )}
      </div>
      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full min-w-[680px] border-collapse font-reading text-sm">
          <thead>
            <tr className="bg-muted/50 text-center font-display text-xs font-semibold uppercase">
              {matrixHeaders.map((header, index) => (
                <th
                  key={`${header}-${index}`}
                  className="border-r border-b border-border px-3 py-2 text-left"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {annex.rows.map((row) => (
              <tr key={row.rowKey} className="align-top">
                {isMatrix ? (
                  row.columns.map((column, index) => (
                    <td
                      key={`${row.rowKey}-${index}`}
                      className="border-r border-b border-border px-3 py-2"
                    >
                      {column || "—"}
                    </td>
                  ))
                ) : (
                  <>
                    <td
                      className={`border-r border-b border-border px-3 py-2 ${row.itemCode ? "font-medium" : "pl-8"}`}
                    >
                      {row.itemCode && (
                        <span className="mr-1">{row.itemCode} -</span>
                      )}
                      {row.description}
                      {row.note && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          ({row.note})
                        </span>
                      )}
                    </td>
                    <td className="border-b border-border px-3 py-2 text-center font-medium">
                      {row.amountDisplay || "—"}
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
