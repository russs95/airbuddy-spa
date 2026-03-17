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
    theme?: "light" | "dark"
}

export const DEFAULT_RANGES_HOURS: Record<string, number> = {
    "15m": 0.25,
    "30m": 0.5,
    "1h": 1,
    "3h": 3,
    "6h": 6,
    "12h": 12,
    "24h": 24,
}

const DISPLAY_TZ = "Asia/Jakarta"

function toFiniteNumber(x: unknown): number | null {
    const n = Number(x)
    return Number.isFinite(n) ? n : null
}

function niceStep(targetStep: number) {
    if (!Number.isFinite(targetStep) || targetStep <= 0) return 1
    const pow = Math.pow(10, Math.floor(Math.log10(targetStep)))
    const base = targetStep / pow

    let nice = 1
    if (base <= 1) nice = 1
    else if (base <= 2) nice = 2
    else if (base <= 5) nice = 5
    else nice = 10

    return nice * pow
}

function niceBounds(minV: number, maxV: number, ticks: number) {
    if (!Number.isFinite(minV) || !Number.isFinite(maxV)) {
        return { min: 0, max: 1, step: 1 }
    }

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

function formatTimeShort(tsSec: number) {
    const d = new Date(tsSec * 1000)
    return new Intl.DateTimeFormat("en-GB", {
        timeZone: DISPLAY_TZ,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    }).format(d)
}

function formatTimeTooltip(tsSec: number) {
    const d = new Date(tsSec * 1000)
    return new Intl.DateTimeFormat("en-GB", {
        timeZone: DISPLAY_TZ,
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    }).format(d)
}

function setupCanvas(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("2d ctx unavailable")

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()

    const W = Math.max(1, Math.floor(rect.width))
    const H = Math.max(1, Math.floor(rect.height))

    canvas.width = Math.max(1, Math.floor(W * dpr))
    canvas.height = Math.max(1, Math.floor(H * dpr))

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    return { ctx, W, H }
}

function buildTickTimes(minT: number, maxT: number, count: number) {
    if (count <= 1) return [minT]

    const out: number[] = []
    for (let i = 0; i < count; i++) {
        out.push(minT + ((maxT - minT) * i) / (count - 1))
    }
    return out
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
    if (!data.length) return

    ctx.save()
    ctx.strokeStyle = color
    ctx.lineWidth = width
    ctx.lineJoin = "round"
    ctx.lineCap = "round"

    let prevT: number | null = null
    let pathOpen = false

    for (const d of data) {
        const x = xMap(d.t)
        const y = yMap(d.v)
        const gapTooBig = prevT != null && d.t - prevT > maxGapS

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
    if (!data.length || radius <= 0) return

    ctx.save()
    ctx.fillStyle = color

    for (const d of data) {
        const x = xMap(d.t)
        const y = yMap(d.v)
        ctx.beginPath()
        ctx.arc(x, y, radius, 0, Math.PI * 2)
        ctx.fill()
    }

    ctx.restore()
}

function roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
) {
    const rr = Math.min(r, w / 2, h / 2)
    ctx.beginPath()
    ctx.moveTo(x + rr, y)
    ctx.arcTo(x + w, y, x + w, y + h, rr)
    ctx.arcTo(x + w, y + h, x, y + h, rr)
    ctx.arcTo(x, y + h, x, y, rr)
    ctx.arcTo(x, y, x + w, y, rr)
    ctx.closePath()
}

export function drawTimeSeriesChart(opts: DrawOpts) {
    const canvas = opts.canvas
    const ranges = opts.rangesHours || DEFAULT_RANGES_HOURS
    const rangeKey = opts.rangeKey || "1h"
    const hours = ranges[rangeKey] || 1
    const maxGapS = Number.isFinite(opts.maxGapS) ? Number(opts.maxGapS) : 240
    const theme = opts.theme || "light"

    const palette =
        theme === "dark"
            ? {
                text: "rgba(238, 242, 247, 0.95)",
                muted: "rgba(238, 242, 247, 0.72)",
                axis: "rgba(255, 255, 255, 0.18)",
                grid: "rgba(255, 255, 255, 0.08)",
                crosshair: "rgba(255, 255, 255, 0.08)",
                empty: "rgba(238, 242, 247, 0.72)",
                tooltipBg: "rgba(8, 15, 28, 0.92)",
                tooltipBorder: "rgba(255, 255, 255, 0.16)",
            }
            : {
                text: "rgba(17, 24, 39, 0.95)",
                muted: "rgba(17, 24, 39, 0.65)",
                axis: "rgba(0, 0, 0, 0.16)",
                grid: "rgba(0, 0, 0, 0.06)",
                crosshair: "rgba(0, 0, 0, 0.05)",
                empty: "rgba(17, 24, 39, 0.65)",
                tooltipBg: "rgba(255, 255, 255, 0.96)",
                tooltipBorder: "rgba(0, 0, 0, 0.12)",
            }

    const timestamps = Array.isArray(opts.timestamps) ? opts.timestamps : []
    const seriesList = Array.isArray(opts.series) ? opts.series : []

    let maxDataT: number | null = null
    for (const t of timestamps) {
        const v = toFiniteNumber(t)
        if (v != null && (maxDataT == null || v > maxDataT)) maxDataT = v
    }

    const { ctx, W, H } = setupCanvas(canvas)
    ctx.clearRect(0, 0, W, H)
    canvas.title = ""

    if (W < 40 || H < 40) return

    if (maxDataT == null) {
        ctx.fillStyle = palette.empty
        ctx.font = "13px system-ui, sans-serif"
        ctx.fillText("No data", 12, 22)
        return
    }

    const cutoff = maxDataT - hours * 3600

    const builtSeries = seriesList.map((s) => ({
        name: s.name || "",
        color: s.color || "#000000",
        width: s.width ?? 2,
        pointRadius: s.pointRadius ?? 2,
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
        ctx.fillStyle = palette.empty
        ctx.font = "13px system-ui, sans-serif"
        ctx.fillText("No data in range", 12, 22)
        return
    }

    const allVals: number[] = []
    for (const s of builtSeries) {
        for (const d of s.data) allVals.push(d.v)
    }

    const minV = allVals.length ? Math.min(...allVals) : 0
    const maxV = allVals.length ? Math.max(...allVals) : 1
    const yB = niceBounds(minV, maxV, 5)

    const minT = cutoff
    const maxT = maxDataT
    const safeSpanT = Math.max(1, maxT - minT)
    const safeSpanV = Math.max(1e-9, yB.max - yB.min)

    const padL = W < 480 ? 48 : 58
    const padR = 10
    const padT = 8
    const padB = 20

    const plotW = Math.max(1, W - padL - padR)
    const plotH = Math.max(1, H - padT - padB)

    const xMap = (t: number) => padL + ((t - minT) / safeSpanT) * plotW
    const yMap = (v: number) => padT + (1 - (v - yB.min) / safeSpanV) * plotH

    const yFmt =
        typeof opts.yLabelFmt === "function"
            ? opts.yLabelFmt
            : (v: number) => String(v)

    const tickCount = W < 420 ? 4 : W < 760 ? 5 : 6
    const tickTimes = buildTickTimes(minT, maxT, tickCount)

    function drawBase() {
        ctx.clearRect(0, 0, W, H)

        ctx.strokeStyle = palette.grid
        ctx.lineWidth = 1
        ctx.beginPath()
        for (let i = 0; i <= 4; i++) {
            const y = padT + (i / 4) * plotH
            ctx.moveTo(padL, y)
            ctx.lineTo(padL + plotW, y)
        }
        ctx.stroke()

        ctx.strokeStyle = palette.axis
        ctx.beginPath()
        ctx.moveTo(padL, padT)
        ctx.lineTo(padL, padT + plotH)
        ctx.lineTo(padL + plotW, padT + plotH)
        ctx.stroke()

        ctx.fillStyle = palette.muted
        ctx.font = "11px system-ui, sans-serif"
        ctx.textAlign = "left"
        ctx.textBaseline = "middle"

        for (let i = 0; i <= 4; i++) {
            const v = yB.max - (i / 4) * (yB.max - yB.min)
            const y = padT + (i / 4) * plotH
            ctx.fillText(String(yFmt(v)), 8, y)
        }

        ctx.font = "11px system-ui, sans-serif"
        ctx.textAlign = "center"
        ctx.textBaseline = "alphabetic"

        for (const t of tickTimes) {
            const x = xMap(t)

            ctx.strokeStyle = palette.crosshair
            ctx.beginPath()
            ctx.moveTo(x, padT)
            ctx.lineTo(x, padT + plotH)
            ctx.stroke()

            ctx.fillStyle = palette.muted
            ctx.fillText(formatTimeShort(t), x, padT + plotH + 14)
        }

        ctx.textAlign = "left"
        ctx.textBaseline = "alphabetic"

        for (const s of builtSeries) {
            s.data.sort((a, b) => a.t - b.t)
            drawSeriesWithGaps(ctx, s.data, xMap, yMap, s.color, s.width, maxGapS)
            drawPoints(ctx, s.data, xMap, yMap, s.color, s.pointRadius)
        }
    }

    function drawHover(mouseX: number, mouseY: number) {
        let nearest: { time: number; value: number; name: string; color: string } | null = null
        let bestDx = Infinity

        for (const s of builtSeries) {
            for (const d of s.data) {
                const x = xMap(d.t)
                const dx = Math.abs(mouseX - x)
                if (dx < bestDx) {
                    bestDx = dx
                    nearest = {
                        time: d.t,
                        value: d.v,
                        name: s.name,
                        color: s.color,
                    }
                }
            }
        }

        drawBase()

        if (!nearest || bestDx >= 16) {
            canvas.title = ""
            return
        }

        canvas.title = `${formatTimeTooltip(nearest.time)}\n${nearest.name}: ${yFmt(nearest.value)}`

        const x = xMap(nearest.time)
        const y = yMap(nearest.value)

        ctx.strokeStyle = nearest.color
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(x, padT)
        ctx.lineTo(x, padT + plotH)
        ctx.stroke()

        ctx.beginPath()
        ctx.fillStyle = nearest.color
        ctx.arc(x, y, 4, 0, Math.PI * 2)
        ctx.fill()

        const tooltipLines = [
            formatTimeTooltip(nearest.time),
            `${nearest.name}: ${yFmt(nearest.value)}`,
        ]

        ctx.font = "12px system-ui, sans-serif"
        ctx.textAlign = "left"
        ctx.textBaseline = "alphabetic"

        const tooltipW = Math.max(...tooltipLines.map((line) => ctx.measureText(line).width)) + 16
        const tooltipH = tooltipLines.length * 16 + 10

        let tipX = x + 10
        let tipY = mouseY - tooltipH - 6

        if (tipX + tooltipW > W - 6) tipX = x - tooltipW - 10
        if (tipX < 6) tipX = 6
        if (tipY < 6) tipY = 6
        if (tipY + tooltipH > H - 6) tipY = H - tooltipH - 6

        ctx.fillStyle = palette.tooltipBg
        ctx.strokeStyle = palette.tooltipBorder
        ctx.lineWidth = 1
        roundRect(ctx, tipX, tipY, tooltipW, tooltipH, 8)
        ctx.fill()
        ctx.stroke()

        ctx.fillStyle = palette.text
        tooltipLines.forEach((line, i) => {
            ctx.fillText(line, tipX + 8, tipY + 18 + i * 16)
        })
    }

    drawBase()

    canvas.onmousemove = (ev: MouseEvent) => {
        const rect = canvas.getBoundingClientRect()
        const mouseX = ev.clientX - rect.left
        const mouseY = ev.clientY - rect.top
        drawHover(mouseX, mouseY)
    }

    canvas.onmouseleave = () => {
        canvas.title = ""
        drawBase()
    }
}