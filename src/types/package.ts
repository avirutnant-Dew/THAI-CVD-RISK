export interface HealthPackage {
  packageId: string
  packageName: string
  shortDescription: string
  fullDescription: string
  normalPrice?: number
  promoPrice?: number
  imageUrl?: string
  detailUrl?: string
  includedTests: string[]
  packageTags: string[]
  minAge: number
  maxAge: number
  active: boolean
  priority: number
  demoOnly?: boolean
}

export interface PackageMatch extends HealthPackage {
  matchScore: number
  matchReasons: string[]
  matchedTests: string[]
}
