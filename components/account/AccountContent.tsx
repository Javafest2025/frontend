"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useForm } from "react-hook-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import {
  User,
  GraduationCap,
  Settings,
  Camera,
  Save,
  Edit3,
  ExternalLink,
  MapPin,
  Building,
  Globe,
  Mail,
  Calendar,
  Briefcase,
  Github,
  Facebook,
  Loader2,
  CheckCircle,
  AlertCircle,
  Trash2,
  Eye,
  Languages,
  Clock
} from "lucide-react"
import { accountApi } from "@/lib/api/account"
import { getUserData } from "@/lib/api/auth"
import { UserAccount, UserAccountForm } from "@/types/account"
import { ACCOUNT_SECTIONS, SOCIAL_LINKS, PROFILE_IMAGE_CONSTRAINTS } from "@/constants/account"
import { cn } from "@/lib/utils/cn"

export function AccountContent() {
  const [accountData, setAccountData] = useState<UserAccount | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [activeSection, setActiveSection] = useState("personal")

  const userData = getUserData()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isDirty }
  } = useForm<UserAccountForm>()

  // Load account data and initialize form
  useEffect(() => {
    const loadAccountData = async () => {
      try {
        const account = await accountApi.getAccount()
        setAccountData(account)

        if (account) {
          // Create form data from account data, preserving existing values
          const formData: Partial<UserAccountForm> = {
            fullName: account.fullName || "",
            institution: account.institution || "",
            department: account.department || "",
            position: account.position || "",
            bio: account.bio || "",
            websiteUrl: account.websiteUrl || "",
            googleScholarUrl: account.googleScholarUrl || "",
            linkedinUrl: account.linkedinUrl || "",
            githubUrl: account.githubUrl || "",
            facebookUrl: account.facebookUrl || "",
            orcidId: account.orcidId || "",
            addressLine1: account.addressLine1 || "",
            addressLine2: account.addressLine2 || "",
            city: account.city || "",
            stateProvinceRegion: account.stateProvinceRegion || "",
            postalCode: account.postalCode || "",
            country: account.country || "",
            timezone: account.timezone || "",
            languagePreference: account.languagePreference || ""
          }

          // Reset form with existing data
          reset(formData)
        } else {
          // If no account data, initialize with empty values
          reset({
            fullName: "",
            institution: "",
            department: "",
            position: "",
            bio: "",
            websiteUrl: "",
            googleScholarUrl: "",
            linkedinUrl: "",
            githubUrl: "",
            facebookUrl: "",
            orcidId: "",
            addressLine1: "",
            addressLine2: "",
            city: "",
            stateProvinceRegion: "",
            postalCode: "",
            country: "",
            timezone: "",
            languagePreference: ""
          })
        }
      } catch (error) {
        console.error("Failed to load account data:", error)
        toast.error("Failed to load account information")
      } finally {
        setIsLoading(false)
      }
    }

    loadAccountData()
  }, [reset])

  // Handle form submission
  const onSubmit = async (data: UserAccountForm) => {
    if (!isDirty) {
      setIsEditMode(false)
      return
    }

    setIsUpdating(true)
    try {
      // Only send changed fields that have values
      const updateData: Partial<UserAccountForm> = {}

      // Get current form values and existing account data
      Object.keys(data).forEach((key) => {
        const fieldKey = key as keyof UserAccountForm
        const newValue = data[fieldKey]?.trim()
        const existingValue = accountData?.[fieldKey] || ""

        // Include field if it has a value or if it's different from existing
        if (newValue !== undefined && (newValue !== "" || existingValue !== "")) {
          updateData[fieldKey] = newValue
        }
      })

      const result = await accountApi.updateAccount(updateData)

      if (result.success) {
        setAccountData(result.data || null)

        // Update form with new data to reflect any server-side changes
        if (result.data) {
          const formData: Partial<UserAccountForm> = {
            fullName: result.data.fullName || "",
            institution: result.data.institution || "",
            department: result.data.department || "",
            position: result.data.position || "",
            bio: result.data.bio || "",
            websiteUrl: result.data.websiteUrl || "",
            googleScholarUrl: result.data.googleScholarUrl || "",
            linkedinUrl: result.data.linkedinUrl || "",
            githubUrl: result.data.githubUrl || "",
            facebookUrl: result.data.facebookUrl || "",
            orcidId: result.data.orcidId || "",
            addressLine1: result.data.addressLine1 || "",
            addressLine2: result.data.addressLine2 || "",
            city: result.data.city || "",
            stateProvinceRegion: result.data.stateProvinceRegion || "",
            postalCode: result.data.postalCode || "",
            country: result.data.country || "",
            timezone: result.data.timezone || "",
            languagePreference: result.data.languagePreference || ""
          }
          reset(formData)
        }

        setIsEditMode(false)
        toast.success("Account updated successfully!")
      } else {
        toast.error(result.message || "Failed to update account")
      }
    } catch (error) {
      console.error("Update error:", error)
      toast.error("Failed to update account")
    } finally {
      setIsUpdating(false)
    }
  }

  // Handle cancel editing
  const handleCancelEdit = () => {
    if (accountData) {
      // Reset form to original values
      const formData: Partial<UserAccountForm> = {
        fullName: accountData.fullName || "",
        institution: accountData.institution || "",
        department: accountData.department || "",
        position: accountData.position || "",
        bio: accountData.bio || "",
        websiteUrl: accountData.websiteUrl || "",
        googleScholarUrl: accountData.googleScholarUrl || "",
        linkedinUrl: accountData.linkedinUrl || "",
        githubUrl: accountData.githubUrl || "",
        facebookUrl: accountData.facebookUrl || "",
        orcidId: accountData.orcidId || "",
        addressLine1: accountData.addressLine1 || "",
        addressLine2: accountData.addressLine2 || "",
        city: accountData.city || "",
        stateProvinceRegion: accountData.stateProvinceRegion || "",
        postalCode: accountData.postalCode || "",
        country: accountData.country || "",
        timezone: accountData.timezone || "",
        languagePreference: accountData.languagePreference || ""
      }
      reset(formData)
    }
    setIsEditMode(false)
  }

  // Handle profile image upload
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file
    if (!PROFILE_IMAGE_CONSTRAINTS.allowedTypes.includes(file.type)) {
      toast.error("Please upload a valid image file (JPEG, PNG, or WebP)")
      return
    }

    if (file.size > PROFILE_IMAGE_CONSTRAINTS.maxSize) {
      toast.error("Image size must be less than 5MB")
      return
    }

    setIsUploadingImage(true)
    try {
      // Create a preview URL for immediate display
      const previewUrl = URL.createObjectURL(file)

      // Optimistically update the UI
      setAccountData(prev => prev ? { ...prev, profileImageUrl: previewUrl } : null)

      const result = await accountApi.uploadProfileImage(file)

      if (result.success) {
        // Update with the actual B2 URL
        setAccountData(prev => prev ? { ...prev, profileImageUrl: result.url } : null)
        toast.success("Profile image updated successfully!")
      } else {
        // Revert to previous image if upload failed
        setAccountData(prev => prev ? { ...prev, profileImageUrl: accountData?.profileImageUrl } : null)
        toast.error(result.message || "Failed to upload image")
      }

      // Clean up preview URL
      URL.revokeObjectURL(previewUrl)
    } catch (error) {
      console.error("Image upload error:", error)
      // Revert to previous image if upload failed
      setAccountData(prev => prev ? { ...prev, profileImageUrl: accountData?.profileImageUrl } : null)
      toast.error("Failed to upload image")
    } finally {
      setIsUploadingImage(false)
    }
  }

  // Handle profile image deletion
  const handleImageDelete = async () => {
    setIsUploadingImage(true)
    try {
      // Optimistically remove the image from UI
      setAccountData(prev => prev ? { ...prev, profileImageUrl: undefined } : null)
      
      const result = await accountApi.deleteProfileImage()

      if (result.success) {
        toast.success("Profile image removed successfully!")
      } else {
        // Revert if deletion failed
        setAccountData(prev => prev ? { ...prev, profileImageUrl: accountData?.profileImageUrl } : null)
        toast.error(result.message || "Failed to remove image")
      }
    } catch (error) {
      console.error("Image delete error:", error)
      // Revert if deletion failed
      setAccountData(prev => prev ? { ...prev, profileImageUrl: accountData?.profileImageUrl } : null)
      toast.error("Failed to remove image")
    } finally {
      setIsUploadingImage(false)
    }
  }

  // Get icon component
  const getIcon = (iconName: string) => {
    const icons = {
      User,
      GraduationCap,
      Settings,
      Briefcase,
      Github,
      Facebook,
      Globe
    }
    return icons[iconName as keyof typeof icons] || User
  }

  const renderDetailItem = (label: string, value?: string | null, icon?: React.ReactNode) => {
    if (!value || value.trim() === '') return null;
    return (
      <div className="flex items-start gap-3">
        {icon && <div className="mt-1 text-muted-foreground">{icon}</div>}
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="font-medium break-words">{value}</p>
        </div>
      </div>
    );
  };

  const renderDetailLinkItem = (label: string, value?: string | null, icon?: React.ReactNode) => {
    if (!value) return null;
    return (
      <div className="flex items-start gap-3">
        {icon && <div className="mt-1 text-muted-foreground">{icon}</div>}
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">{label}</p>
          <a
            href={value.startsWith('http') ? value : `https://${value}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary hover:underline flex items-center gap-1.5 break-all"
          >
            <span>{value}</span>
            <ExternalLink className="h-3 w-3 flex-shrink-0" />
          </a>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-primary/10 via-purple-500/5 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl" />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 border-b border-primary/10 bg-background/40 backdrop-blur-xl"
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gradient-primary flex items-center gap-3">
                <User className="h-8 w-8 text-primary" />
                Account Settings
              </h1>
              <p className="text-muted-foreground mt-1">
                {isEditMode ? "Edit your profile and account preferences" : "View and manage your profile information"}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {!isEditMode ? (
                <Button
                  onClick={() => setIsEditMode(true)}
                  className="gradient-primary-to-accent text-white"
                >
                  <Edit3 className="mr-2 h-4 w-4" />
                  Edit Profile
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleCancelEdit}
                    disabled={isUpdating}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit(onSubmit)}
                    disabled={isUpdating}
                    className="gradient-primary-to-accent text-white"
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content Area */}
      <main className="relative z-10 container mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:col-span-1 space-y-6"
          >
            {/* Profile Overview Card */}
            <Card className="bg-background/40 backdrop-blur-xl border border-primary/10 shadow-lg">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  {/* Scholar Hat Icon */}
                  <div className="relative mb-4">
                    <div className="flex items-center justify-center w-24 h-24 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-full border-2 border-primary/30">
                      <GraduationCap className="h-12 w-12 text-primary" />
                    </div>
                  </div>

                  {/* User Info */}
                  <h3 className="font-semibold text-lg mb-1">
                    {accountData?.fullName || "Add your name"}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-2">
                    {userData?.email}
                  </p>

                </div>
              </CardContent>
            </Card>

            {/* Social Links */}
            <Card className="bg-background/40 backdrop-blur-xl border border-primary/10 shadow-lg">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary" />
                  Social & Professional Links
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {SOCIAL_LINKS.map((social) => {
                  const url = accountData?.[social.url] as string
                  const Icon = getIcon(social.icon)

                  return (
                    <div key={social.platform} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className={cn("h-4 w-4", social.color)} />
                        <span className="text-sm">{social.platform}</span>
                      </div>
                      {url ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 px-2"
                          onClick={() => window.open(url, '_blank')}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">Not set</span>
                      )}
                    </div>
                  )
                })}

                {accountData?.websiteUrl && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Website</span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2"
                      onClick={() => window.open(accountData.websiteUrl, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Right Column */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {!isEditMode ? (
                /* Profile View Mode */
                <motion.div
                  key="profile-view"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="bg-background/40 backdrop-blur-xl border border-primary/10 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5 text-primary" />
                        Profile Details
                      </CardTitle>
                      <CardDescription>
                        A comprehensive overview of your professional and personal information.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* About Section */}
                      {accountData?.bio && (
                        <div>
                          <h4 className="font-semibold text-base mb-3">About</h4>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{accountData.bio}</p>
                        </div>
                      )}

                      <Separator />

                      {/* Professional Details Section */}
                      <div>
                        <h4 className="font-semibold text-base mb-4">Professional & Academic</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                          {renderDetailItem("Institution", accountData?.institution, <Building size={16} />)}
                          {renderDetailItem("Department", accountData?.department, <GraduationCap size={16} />)}
                          {renderDetailItem("Position", accountData?.position, <Briefcase size={16} />)}
                          {renderDetailItem("ORCID iD", accountData?.orcidId)}
                        </div>
                      </div>

                      <Separator />

                      {/* Contact Details Section */}
                      <div>
                        <h4 className="font-semibold text-base mb-4">Contact Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                          {renderDetailLinkItem("Website", accountData?.websiteUrl, <Globe size={16} />)}
                          {renderDetailItem("Address", [
                            accountData?.addressLine1,
                            accountData?.addressLine2,
                            accountData?.city,
                            accountData?.stateProvinceRegion,
                            accountData?.postalCode,
                            accountData?.country
                          ].filter(Boolean).join(', '), <MapPin size={16} />)}
                        </div>
                      </div>

                      <Separator />

                      {/* Preferences Section */}
                      <div>
                        <h4 className="font-semibold text-base mb-4">Preferences</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                          {renderDetailItem("Preferred Language", accountData?.languagePreference, <Languages size={16} />)}
                          {renderDetailItem("Timezone", accountData?.timezone, <Clock size={16} />)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                /* Edit Mode */
                <motion.div
                  key="edit-mode"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {/* Section Tabs */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {ACCOUNT_SECTIONS.map((section) => {
                      const Icon = getIcon(section.icon)
                      return (
                        <Button
                          key={section.id}
                          variant={activeSection === section.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => setActiveSection(section.id)}
                          className={cn(
                            "flex items-center gap-2",
                            activeSection === section.id
                              ? "gradient-primary-to-accent text-white"
                              : "border-primary/20 hover:bg-primary/5"
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          {section.title}
                        </Button>
                      )
                    })}
                  </div>

                  {/* Edit Form Content */}
                  <AnimatePresence mode="wait">
                    {ACCOUNT_SECTIONS.map((section) => {
                      if (activeSection !== section.id) return null

                      const Icon = getIcon(section.icon)

                      return (
                        <motion.div
                          key={section.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Card className="bg-background/40 backdrop-blur-xl border border-primary/10 shadow-lg">
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <Icon className="h-5 w-5 text-primary" />
                                {section.title}
                              </CardTitle>
                              <CardDescription>{section.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {section.fields.map((field) => (
                                  <div
                                    key={field.name}
                                    className={field.type === 'textarea' ? 'md:col-span-2' : ''}
                                  >
                                    <label className="block text-sm font-medium mb-2">
                                      {field.label}
                                      {field.required && <span className="text-red-500 ml-1">*</span>}
                                    </label>

                                    {field.type === 'textarea' ? (
                                      <Textarea
                                        {...register(field.name, { required: field.required })}
                                        placeholder={field.placeholder}
                                        className="min-h-[100px]"
                                      />
                                    ) : field.type === 'select' ? (
                                      <Select
                                        value={watch(field.name) || ""}
                                        onValueChange={(value) => setValue(field.name, value)}
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder={field.placeholder} />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {field.options?.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                              {option.label}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    ) : (
                                      <Input
                                        {...register(field.name, { required: field.required })}
                                        type={field.type}
                                        placeholder={field.placeholder}
                                      />
                                    )}

                                    {errors[field.name] && (
                                      <p className="text-red-500 text-sm mt-1">
                                        {field.label} is required
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>

                              {/* Social Links for academic section */}
                              {section.id === 'academic' && (
                                <div className="border-t pt-6">
                                  <h4 className="font-medium mb-4 flex items-center gap-2">
                                    <Globe className="h-4 w-4 text-primary" />
                                    Social & Professional Links
                                  </h4>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {SOCIAL_LINKS.map((social) => (
                                      <div key={social.platform}>
                                        <label className="block text-sm font-medium mb-2">
                                          {social.platform}
                                        </label>
                                        <Input
                                          {...register(social.url as keyof UserAccountForm)}
                                          type="url"
                                          placeholder={`Your ${social.platform} profile URL`}
                                        />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  )
} 