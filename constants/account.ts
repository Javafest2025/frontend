import { AccountSection, SocialLink } from "@/types/account"
import { User, Phone, Calendar, GraduationCap, Globe, Settings, BookOpen, Target } from "lucide-react"

export const ACCOUNT_SECTIONS: AccountSection[] = [
  {
    id: "personal",
    title: "Personal Information",
    description: "Basic personal details and contact information",
    icon: "User",
    fields: [
      {
        name: "fullName",
        label: "Full Name",
        type: "text",
        placeholder: "Enter your full name",
        required: true
      },
      {
        name: "phoneNumber",
        label: "Phone Number",
        type: "text",
        placeholder: "+1-555-123-4567"
      },
      {
        name: "dateOfBirth",
        label: "Date of Birth",
        type: "text",
        placeholder: "1990-01-01"
      },
      {
        name: "bio",
        label: "Bio",
        type: "textarea",
        placeholder: "Tell us about yourself, your research interests, and academic background"
      }
    ]
  },
  {
    id: "academic",
    title: "Academic & Professional",
    description: "Institution, affiliation, and professional details",
    icon: "GraduationCap",
    fields: [
      {
        name: "affiliation",
        label: "Affiliation",
        type: "text",
        placeholder: "Your university, company, or organization"
      },
      {
        name: "positionTitle",
        label: "Position Title",
        type: "text",
        placeholder: "e.g. PhD Candidate, Research Scientist"
      },
      {
        name: "researchInterests",
        label: "Research Interests",
        type: "textarea",
        placeholder: "Your research areas and interests"
      },
      {
        name: "orcidId",
        label: "ORCID iD",
        type: "text",
        placeholder: "0000-0000-0000-0000"
      },
      {
        name: "personalWebsiteUrl",
        label: "Personal Website",
        type: "text",
        placeholder: "https://yourwebsite.com"
      }
    ]
  }
]

export const SOCIAL_LINKS: SocialLink[] = [
  {
    platform: "Google Scholar",
    url: "googleScholarUrl",
    icon: "ScholarIcon",
    color: "text-blue-600"
  },
  {
    platform: "LinkedIn",
    url: "linkedInUrl",
    icon: "Linkedin",
    color: "text-blue-700"
  },
  {
    platform: "Twitter",
    url: "twitterUrl",
    icon: "Twitter",
    color: "text-blue-400"
  }
]

export const PROFILE_IMAGE_CONSTRAINTS = {
  maxSize: 3 * 1024 * 1024, // 3MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  dimensions: {
    min: { width: 100, height: 100 },
    max: { width: 2000, height: 2000 }
  }
} 