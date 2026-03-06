// app/lib/chartCore.ts
export type SeriesDef = {
    name: string
    color: string
    values: Array<number | null>
    width?: number
    pointRadius?: number
}

export type DrawOpts = {
    canvas: HTMLCanvasElement
    timestamps: Array<number | null>
    series: SeriesDef[]
    rangeKey?: string
    rangesHours?: Record<string, number>
    maxGapS?: number
    yLabelFmt?: (v: number) => string
}

export const DEFAULT_RANGES_HOURS: Record<string, number> = {
    "1h": 1,
    "6h": 6,
    "24h": 24,
    "72h": 72,
    "7d": 24 * 7,
    "30d": 24 * 30,
}

const DISPLAY_TZ = "Asia/Jakarta"

function toFiniteNumber(x: any): number | null {
    const n = Number(x)
    return Number.isFinite(n) ? n : null
}

function niceStep(targetStep: number) {
    if (!Number.isFinite(targetStep) || targetStep <= 0) return 1
    const pow = Math.pow(10, Math.floor(Math.log10(targetStep)))
    const base = targetStep / pow
    let nice
    if (base <= 1) nice = 1
    else if (base <= 2) nice = 2
    else if (base <= 5) nice = 5
    else nice = 10
    return nice * pow
}

function niceBounds(minV: number, maxV: number, ticks: number) {
    if (!Number.isFinite(minV) || !Number.isFinite(maxV)) return { min: 0, max: 1, step: 1 }

    if (minV === maxV) {
        const pad = minV === 0 ? 1 : Math.abs(minV) * 0.1
        minV -= pad
        maxV += pad
    }

    const span = maxV - minV
    const rawStep = span / Math.max(1, ticks - 1)
    const step = niceStep(rawStep)

    return {
        min: Math.floor(minV / step) * step,
        max: Math.ceil(maxV / step) * step,
        step,
    }
}

function formatTime(tsSec: number) {
    const d = new Date(tsSec * 1000)
    return new Intl.DateTimeFormat("en-GB", {
        timeZone: DISPLAY_TZ,
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    }).format(d)
}

function setupCanvas(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("2d ctx unavailable")

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()

    canvas.width = Math.max(1, Math.floor(rect.width * dpr))
    canvas.height = Math.max(1, Math.floor(rect.height * dpr))

    // scale drawing back to CSS pixels
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    return { ctx, W: rect.width, H: rect.height }
}

function drawSeriesWithGaps(
    ctx: CanvasRenderingContext2D,
    data: Array<{ t: number; v: number }>,
    xMap: (t: number) => number,
    yMap: (v: number) => number,
    color: string,
    width: number,
    maxGapS: number
) {
    ctx.save()
    ctx.strokeStyle = color
    ctx.lineWidth = width || 2

    let prevT: number | null = null
    let pathOpen = false

    for (const d of data) {
        const x = xMap(d.t)
        const y = yMap(d.v)

        const gapTooBig = prevT != null && (d.t - prevT) > maxGapS

        if (!pathOpen || gapTooBig) {
            if (pathOpen) ctx.stroke()
            ctx.beginPath()
            ctx.moveTo(x, y)
            pathOpen = true
        } else {
            ctx.lineTo(x, y)
        }

        prevT = d.t
    }

    if (pathOpen) ctx.stroke()
    ctx.restore()
}

function drawPoints(
    ctx: CanvasRenderingContext2D,
    data: Array<{ t: number; v: number }>,
    xMap: (t: number) => number,
    yMap: (v: number) => number,
    color: string,
    radius: number
) {
    ctx.save()
    ctx.fillStyle = color
    const r = radius == null ? 3 : radius

    for (const d of data) {
        const x = xMap(d.t)
        const y = yMap(d.v)
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fill()
    }

    ctx.restore()
}

export function drawTimeSeriesChart(opts: DrawOpts) {
    const canvas = opts.canvas
    const ranges = opts.rangesHours || DEFAULT_RANGES_HOURS
    const rangeKey = opts.rangeKey || "24h"
    const hours = ranges[rangeKey] || 24
    const maxGapS = Number.isFinite(opts.maxGapS) ? (opts.maxGapS as number) : 240

    const timestamps = Array.isArray(opts.timestamps) ? opts.timestamps : []
    const seriesList = Array.isArray(opts.series) ? opts.series : []

    // determine latest timestamp present
    let maxDataT: number | null = null
    for (const t of timestamps) {
        const v = toFiniteNumber(t)
        if (v != null && (maxDataT == null || v > maxDataT)) maxDataT = v
    }

    const { ctx, W, H } = setupCanvas(canvas)
    ctx.clearRect(0, 0, W, H)

    if (maxDataT == null) {
        ctx.fillStyle = "#666"
        ctx.fillText("No data", 10, 20)
        canvas.title = ""
        return
    }

    const cutoff = maxDataT - hours * 3600

    const builtSeries = seriesList.map((s) => ({
        name: s.name || "",
        color: s.color || "#000",
        width: s.width || 2,
        pointRadius: s.pointRadius == null ? 3 : s.pointRadius,
        data: [] as Array<{ t: number; v: number }>,
    }))

    const readingTimes: number[] = []

    for (let i = 0; i < timestamps.length; i++) {
        const t = toFiniteNumber(timestamps[i])
        if (t == null || t < cutoff || t > maxDataT) continue

        let anyVal = false
        for (let si = 0; si < seriesList.length; si++) {
            const arr = Array.isArray(seriesList[si]?.values) ? seriesList[si].values : []
            const v = toFiniteNumber(arr[i])
            if (v == null) continue

            builtSeries[si].data.push({ t, v })
            anyVal = true
        }
        if (anyVal) readingTimes.push(t)
    }

    if (!readingTimes.length) {
        ctx.fillStyle = "#666"
        ctx.fillText("No data in range", 10, 20)
        canvas.title = ""
        return
    }

    const padL = 60
    const padR = 20
    const padT = 20
    const padB = 50

    const plotW = W - padL - padR
    const plotH = H - padT - padB

    const minT = cutoff
    const maxT = maxDataT

    const xMap = (t: number) => padL + ((t - minT) / (maxT - minT)) * plotW

    const allVals: number[] = []
    for (const s of builtSeries) for (const d of s.data) allVals.push(d.v)

    const minV = allVals.length ? Math.min(...allVals) : 0
    const maxV = allVals.length ? Math.max(...allVals) : 1
    const yB = niceBounds(minV, maxV, 5)

    const yMap = (v: number) => padT + (1 - (v - yB.min) / (yB.max - yB.min)) * plotH

    // grid
    ctx.strokeStyle = "#eee"
    ctx.beginPath()
    for (let i = 0; i <= 4; i++) {
        const y = padT + (i / 4) * plotH
        ctx.moveTo(padL, y)
        ctx.lineTo(padL + plotW, y)
    }
    ctx.stroke()

    // axes
    ctx.strokeStyle = "#ccc"
    ctx.beginPath()
    ctx.moveTo(padL, padT)
    ctx.lineTo(padL, padT + plotH)
    ctx.lineTo(padL + plotW, padT + plotH)
    ctx.stroke()

    // labels
    const yFmt = typeof opts.yLabelFmt === "function" ? opts.yLabelFmt : (v: number) => String(v)
    ctx.fillStyle = "#666"
    for (let i = 0; i <= 4; i++) {
        const v = yB.max - (i / 4) * (yB.max - yB.min)
        const y = padT + (i / 4) * plotH
        ctx.fillText(String(yFmt(v)), 8, y + 4)
    }

    // x labels
    const midT = Math.floor((minT + maxT) / 2)
    ctx.fillStyle = "#777"
    ctx.fillText(formatTime(minT), padL, padT + plotH + 25)
    ctx.fillText(formatTime(midT), padL + plotW / 2 - 40, padT + plotH + 25)
    ctx.fillText(formatTime(maxT), padL + plotW - 80, padT + plotH + 25)

    // series
    for (const s of builtSeries) {
        s.data.sort((a, b) => a.t - b.t)
        drawSeriesWithGaps(ctx, s.data, xMap, yMap, s.color, s.width, maxGapS)
        drawPoints(ctx, s.data, xMap, yMap, s.color, s.pointRadius)
    }

    // hover tooltip via title
    canvas.onmousemove = (ev) => {
        const rect = canvas.getBoundingClientRect()
        const mouseX = ev.clientX - rect.left

        let nearest: { time: number; value: number; name: string } | null = null
        let bestDx = Infinity

        for (const s of builtSeries) {
            for (const d of s.data) {
                const x = xMap(d.t)
                const dx = Math.abs(mouseX - x)
                if (dx < bestDx) {
                    bestDx = dx
                    nearest = { time: d.t, value: d.v, name: s.name }
                }
            }
        }

        if (nearest && bestDx < 10) {
            canvas.title = `${formatTime(nearest.time)}\n${nearest.name}: ${yFmt(nearest.value)}`
        } else {
            canvas.title = ""
        }
    }
}