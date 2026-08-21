import type { RiskFactor } from '../types/recommendation'
import type { HealthPackage, PackageMatch } from '../types/package'

export interface PackageMatchInput { riskLevel: string; riskPercent: number; riskFactors: RiskFactor[]; suggestedTests: string[]; age: number; existingCvd: boolean; packageTags: string[] }

export function matchPackages(input: PackageMatchInput, packages: HealthPackage[]): PackageMatch[] {
  return packages.filter((item) => item.active && input.age >= item.minAge && input.age <= item.maxAge).map((item) => {
    const matchedTags = item.packageTags.filter((tag) => input.packageTags.includes(tag))
    const matchedTests = item.includedTests.filter((test) => input.suggestedTests.includes(test))
    // Priority only orders eligible matches; it must never make an unrelated
    // package eligible when no approved tag or suggested test matches.
    const matchScore = (matchedTags.length * 10) + (matchedTests.length * 4)
    const matchReasons = matchedTags.map((tag) => `สอดคล้องกับหัวข้อที่พบ: ${tag.replaceAll('_', ' ')}`)
    if (matchedTests.length) matchReasons.push(`มีรายการตรวจที่สอดคล้อง ${matchedTests.length} รายการ`)
    return { ...item, matchScore, matchReasons, matchedTests }
  }).filter((item) => item.matchScore > 0).sort((a, b) => b.matchScore - a.matchScore || a.priority - b.priority)
}
