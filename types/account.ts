export interface UserAccount {
  id: string
  userId?: string
  email?: string
  createdAt?: string
  updatedAt?: string

  fullName?: string
  avatarUrl?: string
  phoneNumber?: string
  dateOfBirth?: string
  bio?: string
  affiliation?: string
  positionTitle?: string
  researchInterests?: string
  googleScholarUrl?: string
  personalWebsiteUrl?: string
  orcidId?: string
  linkedInUrl?: string
  twitterUrl?: string
}

export interface UserAccountForm {
  fullName: string
  phoneNumber: string
  dateOfBirth: string
  bio: string
  affiliation: string
  positionTitle: string
  researchInterests: string
  googleScholarUrl: string
  personalWebsiteUrl: string
  orcidId: string
  linkedInUrl: string
  twitterUrl: string
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