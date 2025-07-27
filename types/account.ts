export interface UserAccount {
  id: string
  email?: string
  createdAt?: string
  updatedAt?: string

  fullName?: string
  institution?: string
  department?: string
  position?: string
  bio?: string

  profileImageUrl?: string
  profileImageFilename?: string

  websiteUrl?: string
  googleScholarUrl?: string
  linkedinUrl?: string
  githubUrl?: string
  facebookUrl?: string
  orcidId?: string

  addressLine1?: string
  addressLine2?: string
  city?: string
  stateProvinceRegion?: string
  postalCode?: string
  country?: string

  languagePreference?: string
  timezone?: string
}

export interface UserAccountForm {
  fullName: string
  institution: string
  department: string
  position: string
  bio: string

  websiteUrl: string
  googleScholarUrl: string
  linkedinUrl: string
  githubUrl: string
  facebookUrl: string
  orcidId: string

  addressLine1: string
  addressLine2: string
  city: string
  stateProvinceRegion: string
  postalCode: string
  country: string

  languagePreference: string
  timezone: string
}

export interface SocialLink {
  platform: string
  url: keyof UserAccount
  icon: string
  color: string
}

export interface AccountSection {
  id: string
  title: string
  description: string
  icon: string
  fields: AccountField[]
}

export interface AccountField {
  name: keyof UserAccountForm
  label: string
  type: 'text' | 'textarea' | 'url' | 'select'
  placeholder: string
  required?: boolean
  options?: { value: string; label: string }[]
} 