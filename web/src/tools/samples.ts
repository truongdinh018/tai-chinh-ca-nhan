/** Sample params — generated from scripts/run_tool.py SAMPLES via scripts/export_tool_samples.py */
import samplesJson from './samples.json'

export const TOOL_SAMPLES = samplesJson as Record<string, Record<string, unknown>>

export function sampleJsonFor(toolId: string): string {
  const sample = TOOL_SAMPLES[toolId] ?? {}
  return JSON.stringify(sample, null, 2)
}
