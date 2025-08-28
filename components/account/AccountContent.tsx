"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { toast } from "sonner"
import { format } from "date-fns"
import { cn } from "@/lib/utils/cn"
import {
  User,
  GraduationCap,
  Settings,
  Camera,
  ExternalLink,
  Globe,
  Mail,
  Phone,
  Calendar as CalendarIcon,
  Briefcase,
  Loader2,
  BookOpen,
  Target,
  Building,
  Award,
  Linkedin,
  Twitter,
  ChevronDown,
  Edit3,
  Save
} from "lucide-react"
import { accountApi, getUserData } from "@/lib/api/user-service"
import { UserAccount, UserAccountForm } from "@/types/account"
import { SOCIAL_LINKS } from "@/constants/account"
import { useForm } from "react-hook-form"
import { AvatarUploader } from "./AvatarUploader"

// Custom Calendar Component with Year Picker
interface EnhancedCalendarProps {
  readonly selected?: Date
  readonly onSelect?: (date: Date | undefined) => void
  readonly disabled?: (date: Date) => boolean
  readonly className?: string
}

function EnhancedCalendar({ selected, onSelect, disabled, className }: EnhancedCalendarProps) {
  const [currentDate, setCurrentDate] = useState(selected || new Date())
  const [isYearPickerOpen, setIsYearPickerOpen] = useState(false)

  // Update currentDate when selected changes
  useEffect(() => {
    if (selected) {
      setCurrentDate(selected)
    }
  }, [selected])

  // Generate years from 1900 to current year
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: currentYear - 1900 + 1 }, (_, i) => currentYear - i)

  const handleYearChange = (year: string) => {
    const newDate = new Date(currentDate)
    newDate.setFullYear(parseInt(year))
    setCurrentDate(newDate)
    setIsYearPickerOpen(false)
  }

  return (
    <div className={cn("p-3", className)}>
      {/* Year Picker Header */}
      <div className="flex items-center justify-between mb-4">
        <Popover open={isYearPickerOpen} onOpenChange={setIsYearPickerOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="h-8 px-2 text-sm bg-background/50 border-2 border-primary/20 hover:border-primary/40 text-foreground"
            >
              {currentDate.getFullYear()}
              <ChevronDown className="ml-1 h-3 w-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-0 bg-background/95 backdrop-blur-xl border-2 border-primary/20 shadow-xl">
            <div className="max-h-48 overflow-y-auto">
              {years.map((year) => (
                <Button
                  key={year}
                  variant="ghost"
                  className="w-full justify-start text-sm hover:bg-primary/10 border-b border-primary/10 text-foreground"
                  onClick={() => handleYearChange(year.toString())}
                >
                  {year}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Calendar Component */}
      <Calendar
        mode="single"
        selected={selected}
        onSelect={onSelect}
        disabled={disabled}
        month={currentDate}
        onMonthChange={setCurrentDate}
        className="bg-transparent"
        classNames={{
          months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
          month: "space-y-4",
          caption: "flex justify-center pt-1 relative items-center",
          caption_label: "text-sm font-medium text-foreground",
          nav: "space-x-1 flex items-center",
          nav_button: cn(
            "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 border-2 border-primary/20 hover:border-primary/40"
          ),
          nav_button_previous: "absolute left-1",
          nav_button_next: "absolute right-1",
          table: "w-full border-collapse space-y-1",
          head_row: "flex",
          head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
          row: "flex w-full mt-2",
          cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
          day: cn(
            "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-primary/10 rounded-md transition-colors text-foreground"
          ),
          day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
          day_today: "bg-accent text-accent-foreground",
          day_outside: "day-outside text-muted-foreground aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
          day_disabled: "text-muted-foreground opacity-50",
          day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
          day_hidden: "invisible",
        }}
      />
    </div>
  )
}

export function AccountContent() {
  const [accountData, setAccountData] = useState<UserAccount | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  const userData = getUserData()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { isDirty }
  } = useForm<UserAccountForm>()

  // Load account data
  useEffect(() => {
    const loadAccountData = async () => {
      try {
        const account = await accountApi.getAccount()

        if (account === null) {
          // Account fetch returned null, which means authentication failed
          console.log("🔄 Authentication failed, redirecting to login");
          // Redirect to login page
          window.location.href = '/auth/login';
          return;
        }

        setAccountData(account)

        if (account) {
          // Create form data from account data, preserving existing values
          const formData: Partial<UserAccountForm> = {
            fullName: account.fullName || "",
            phoneNumber: account.phoneNumber || "",
            dateOfBirth: account.dateOfBirth || "",
            bio: account.bio || "",
            affiliation: account.affiliation || "",
            positionTitle: account.positionTitle || "",
            researchInterests: account.researchInterests || "",
            googleScholarUrl: account.googleScholarUrl || "",
            personalWebsiteUrl: account.personalWebsiteUrl || "",
            orcidId: account.orcidId || "",
            linkedInUrl: account.linkedInUrl || "",
            twitterUrl: account.twitterUrl || ""
          }

          // Reset form with existing data
          reset(formData)
        } else {
          // If no account data, initialize with empty values
          reset({
            fullName: "",
            phoneNumber: "",
            dateOfBirth: "",
            bio: "",
            affiliation: "",
            positionTitle: "",
            researchInterests: "",
            googleScholarUrl: "",
            personalWebsiteUrl: "",
            orcidId: "",
            linkedInUrl: "",
            twitterUrl: ""
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

    try {
      console.log("Submitting form data:", data)

      // Create a clean update object with only changed values
      const updateData: Partial<UserAccountForm> = {}

      // Compare each field with existing data
      Object.keys(data).forEach((key) => {
        const fieldKey = key as keyof UserAccountForm
        const newValue = data[fieldKey]?.toString().trim() || ""
        const existingValue = accountData?.[fieldKey]?.toString() || ""

        // Only include field if it's different from existing
        if (newValue !== existingValue) {
          updateData[fieldKey] = newValue
        }
      })

      console.log("Update data to send:", updateData)

      if (Object.keys(updateData).length === 0) {
        setIsEditMode(false)
        toast.info("No changes to save")
        return
      }

      const result = await accountApi.updateAccount(updateData)

      if (result && result.success) {
        setAccountData(result.data || null)

        // Update form with new data to reflect any server-side changes
        if (result.data) {
          const formData: Partial<UserAccountForm> = {
            fullName: result.data.fullName || "",
            phoneNumber: result.data.phoneNumber || "",
            dateOfBirth: result.data.dateOfBirth || "",
            bio: result.data.bio || "",
            affiliation: result.data.affiliation || "",
            positionTitle: result.data.positionTitle || "",
            researchInterests: result.data.researchInterests || "",
            googleScholarUrl: result.data.googleScholarUrl || "",
            personalWebsiteUrl: result.data.personalWebsiteUrl || "",
            orcidId: result.data.orcidId || "",
            linkedInUrl: result.data.linkedInUrl || "",
            twitterUrl: result.data.twitterUrl || ""
          }
          reset(formData)
        }

        setIsEditMode(false)
        toast.success("Profile updated successfully")
      } else {
        console.error("Update failed with result:", result)
        toast.error(result?.message || "Failed to update profile")
      }
    } catch (error) {
      console.error("Failed to update account:", error)
      if (error instanceof Error) {
        toast.error(`Update failed: ${error.message}`)
      } else {
        toast.error("Failed to update profile")
      }
    }
  }

  const handleCancelEdit = () => {
    if (accountData) {
      const formData: Partial<UserAccountForm> = {
        fullName: accountData.fullName || "",
        phoneNumber: accountData.phoneNumber || "",
        dateOfBirth: accountData.dateOfBirth || "",
        bio: accountData.bio || "",
        affiliation: accountData.affiliation || "",
        positionTitle: accountData.positionTitle || "",
        researchInterests: accountData.researchInterests || "",
        googleScholarUrl: accountData.googleScholarUrl || "",
        personalWebsiteUrl: accountData.personalWebsiteUrl || "",
        orcidId: accountData.orcidId || "",
        linkedInUrl: accountData.linkedInUrl || "",
        twitterUrl: accountData.twitterUrl || ""
      }
      reset(formData)
    }
    setIsEditMode(false)
  }

  const handleAvatarUpdate = (newUrl: string) => {
    setAccountData(prev => prev ? { ...prev, avatarUrl: newUrl } : null)
    setIsUploadingImage(false)
  }

  const handleAvatarDelete = () => {
    setAccountData(prev => prev ? { ...prev, avatarUrl: undefined } : null)
    setIsUploadingImage(false)
  }

  const getIcon = (iconName: string) => {
    const icons: { [key: string]: React.ComponentType<any> } = {
      User,
      GraduationCap,
      Settings,
      Globe,
      Mail,
      Phone,
      Calendar: CalendarIcon,
      Briefcase,
      BookOpen,
      Target,
      Building,
      Award,
      Linkedin,
      Twitter,
      ScholarIcon: GraduationCap
    }
    return icons[iconName] || User
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your account information...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90 relative overflow-hidden">
      {/* Enhanced Animated Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient Orbs */}
        <div className="absolute top-0 -left-4 w-96 h-96 bg-gradient-to-r from-primary/20 to-accent/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-96 h-96 bg-gradient-to-r from-accent/20 to-primary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-gradient-to-r from-primary/15 to-accent/15 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(hsl(var(--muted-foreground)/0.1)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--muted-foreground)/0.1)_1px,transparent_1px)] bg-[size:50px_50px]"></div>

        {/* Floating Particles */}
        <div className="absolute inset-0">
          {Array.from({ length: 20 }, (_, i) => (
            <div
              key={`particle-${i}`}
              className="absolute w-1 h-1 bg-gradient-to-r from-primary/60 to-accent/60 rounded-full opacity-60 animate-ping"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${2 + Math.random() * 3}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* Hero Profile Header */}
      <div className="relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative h-80 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 backdrop-blur-sm border-b border-border"
        >
          {/* Header Background Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-background/20 via-transparent to-background/20"></div>

          {/* Profile Content */}
          <div className="relative z-10 container mx-auto px-6 h-full flex items-end pb-8">
            <div className="flex items-end gap-6 w-full">
              {/* Profile Picture - Floating Style */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 50 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative group"
              >
                <div className="relative">
                  {/* Glowing Ring */}
                  <div className="absolute -inset-2 bg-gradient-to-r from-primary via-accent to-primary rounded-full opacity-75 group-hover:opacity-100 blur-lg transition-all duration-300 shadow-lg hover:shadow-xl"></div>

                  {/* Profile Picture */}
                  <Avatar className="relative h-40 w-40 border-4 border-border shadow-2xl ring-4 ring-primary/10 backdrop-blur-sm">
                    <AvatarImage
                      src={accountData?.avatarUrl || ""}
                      alt="Profile picture"
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-4xl font-bold text-primary-foreground backdrop-blur-sm">
                      <GraduationCap className="h-16 w-16 text-primary-foreground" />
                    </AvatarFallback>
                  </Avatar>

                  {/* Upload Button */}
                  <Button
                    size="sm"
                    className="absolute -bottom-2 -right-2 h-12 w-12 rounded-full p-0 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-xl border-2 border-border backdrop-blur-sm group-hover:scale-110 transition-all duration-300 shadow-lg hover:shadow-xl"
                    onClick={() => {
                      console.log("Camera button clicked")
                      const avatarUploader = document.querySelector('.avatar-uploader-input') as HTMLInputElement
                      console.log("Found avatar uploader input:", avatarUploader)
                      if (avatarUploader) {
                        avatarUploader.click()
                        console.log("Clicked avatar uploader input")
                      } else {
                        console.error("Avatar uploader input not found")
                      }
                    }}
                    disabled={isUploadingImage}
                  >
                    {isUploadingImage ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Camera className="h-5 w-5" />
                    )}
                  </Button>


                </div>
              </motion.div>

              {/* Profile Info */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="flex-1 text-foreground"
              >
                <h1 className="text-5xl font-bold bg-gradient-to-r from-foreground via-primary to-accent bg-clip-text text-transparent mb-2">
                  {accountData?.fullName || "Your Name"}
                </h1>
                <p className="text-xl text-primary flex items-center gap-2 mb-2">
                  <Mail className="h-5 w-5" />
                  {accountData?.email || userData?.email || "your.email@example.com"}
                </p>
                <p className="text-lg text-foreground/90 flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  {accountData?.affiliation || "Add your affiliation"}
                </p>
              </motion.div>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="flex flex-col gap-3"
              >
                {!isEditMode ? (
                  <Button
                    onClick={() => setIsEditMode(true)}
                    className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground shadow-2xl hover:shadow-3xl transition-all duration-300 shadow-lg hover:shadow-xl border border-border backdrop-blur-sm px-8 py-3 text-lg"
                  >
                    <Edit3 className="mr-2 h-5 w-5" />
                    Edit Profile
                  </Button>
                ) : (
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={handleCancelEdit}
                      className="bg-background/20 border-border text-foreground hover:bg-background/30 backdrop-blur-sm"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSubmit(onSubmit)}
                      className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground shadow-2xl hover:shadow-3xl transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                      <Save className="mr-2 h-5 w-5" />
                      Save Changes
                    </Button>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Main Content Area */}
      <main className="relative z-10 container mx-auto p-6 pt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="w-full space-y-6"
        >
          {/* AvatarUploader for camera button access */}
          <div className="fixed inset-0 z-50 hidden" id="avatar-uploader-container">
            <AvatarUploader
              currentAvatarUrl={accountData?.avatarUrl}
              onAvatarUpdate={handleAvatarUpdate}
              onAvatarDelete={handleAvatarDelete}
              onLoadingChange={setIsUploadingImage}
            />
          </div>
          {/* About Section */}
          {(accountData?.bio || isEditMode) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="relative group"
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 to-accent/50 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
              <Card className="relative bg-card/40 backdrop-blur-xl border border-border shadow-2xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10 border-b border-border">
                  <CardTitle className="flex items-center gap-2 text-card-foreground">
                    <BookOpen className="h-5 w-5 text-primary" />
                    About
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {isEditMode ? (
                    <Textarea
                      {...register("bio")}
                      placeholder="Tell us about yourself..."
                      className="min-h-[100px] bg-background/50 border border-border focus:border-primary text-foreground placeholder:text-muted-foreground backdrop-blur-sm"
                    />
                  ) : (
                    <p className="text-foreground/80 leading-relaxed text-lg">{accountData?.bio}</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Professional & Academic Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative group"
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 to-accent/50 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
            <Card className="relative bg-card/40 backdrop-blur-xl border border-border shadow-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10 border-b border-border">
                <CardTitle className="flex items-center gap-2 text-card-foreground">
                  <Award className="h-5 w-5 text-primary" />
                  Professional & Academic
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {isEditMode ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-foreground">
                        Affiliation
                      </label>
                      <Input
                        {...register("affiliation")}
                        placeholder="Your institution or organization"
                        className="bg-background/50 border border-border focus:border-primary text-foreground placeholder:text-muted-foreground backdrop-blur-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-foreground">
                        Position
                      </label>
                      <Input
                        {...register("positionTitle")}
                        placeholder="Your job title or position"
                        className="bg-background/50 border border-border focus:border-primary text-foreground placeholder:text-muted-foreground backdrop-blur-sm"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-2 text-foreground">
                        Research Interests
                      </label>
                      <Textarea
                        {...register("researchInterests")}
                        placeholder="Your research areas and interests"
                        className="min-h-[100px] bg-background/50 border border-border focus:border-primary text-foreground placeholder:text-muted-foreground backdrop-blur-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-foreground">
                        ORCID iD
                      </label>
                      <Input
                        {...register("orcidId")}
                        placeholder="Your ORCID identifier"
                        className="bg-background/50 border border-border focus:border-primary text-foreground placeholder:text-muted-foreground backdrop-blur-sm"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      { label: "Affiliation", value: accountData?.affiliation, icon: Building },
                      { label: "Position", value: accountData?.positionTitle, icon: Briefcase },
                      { label: "Research Interests", value: accountData?.researchInterests, icon: BookOpen },
                      { label: "ORCID iD", value: accountData?.orcidId, icon: Target }
                    ].map((item, index) =>
                      item.value ? (
                        <motion.div
                          key={item.label}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: 0.1 * index }}
                          className="p-4 rounded-xl bg-background/10 backdrop-blur-md border border-primary/20 hover:bg-background/20 hover:border-primary/30 transition-all duration-300 shadow-lg hover:shadow-xl"
                        >
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-gradient-to-r from-primary/30 to-accent/30 backdrop-blur-sm border border-primary/40">
                              <item.icon className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex-1">
                              <p className="text-muted-foreground text-sm font-medium mb-1">{item.label}</p>
                              {item.label === "Research Interests" ? (
                                <div className="flex flex-wrap gap-2">
                                  {item.value?.split(',').map((interest, idx) => (
                                    <span
                                      key={idx}
                                      className="px-3 py-1 text-xs bg-primary/20 backdrop-blur-sm border border-primary/30 rounded-full text-primary-foreground"
                                    >
                                      {interest.trim()}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-foreground font-medium break-words">{item.value}</p>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ) : null
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Contact Information Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="relative group"
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 to-accent/50 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
            <Card className="relative bg-card/40 backdrop-blur-xl border border-border shadow-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10 border-b border-border">
                <CardTitle className="flex items-center gap-2 text-card-foreground">
                  <Mail className="h-5 w-5 text-primary" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {isEditMode ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-foreground">
                        Phone Number
                      </label>
                      <Input
                        {...register("phoneNumber")}
                        placeholder="Your phone number"
                        className="bg-background/50 border border-border focus:border-primary text-foreground placeholder:text-muted-foreground backdrop-blur-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-foreground">
                        Date of Birth
                      </label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal bg-background/50 border border-border focus:border-primary hover:bg-muted/50 transition-all duration-300 shadow-lg hover:shadow-xl text-foreground backdrop-blur-sm",
                              !watch("dateOfBirth") && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {watch("dateOfBirth") ? (
                              (() => {
                                try {
                                  // Parse the date string properly to avoid timezone issues
                                  const [year, month, day] = watch("dateOfBirth").split('-').map(Number)
                                  if (year && month && day) {
                                    // Create date in local timezone (month is 0-indexed)
                                    const date = new Date(year, month - 1, day)
                                    return format(date, "PPP")
                                  }
                                  return "Invalid date"
                                } catch {
                                  return "Invalid date"
                                }
                              })()
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-card/90 backdrop-blur-xl border border-border shadow-xl" align="start">
                          <EnhancedCalendar
                            selected={(() => {
                              const dateValue = watch("dateOfBirth")
                              if (!dateValue) return undefined
                              try {
                                // Parse the date string properly to avoid timezone issues
                                const [year, month, day] = dateValue.split('-').map(Number)
                                if (year && month && day) {
                                  // Create date in local timezone (month is 0-indexed)
                                  return new Date(year, month - 1, day)
                                }
                                return undefined
                              } catch {
                                return undefined
                              }
                            })()}
                            onSelect={(date) => {
                              if (date) {
                                // Fix timezone issue by creating the date in local timezone
                                const year = date.getFullYear()
                                const month = String(date.getMonth() + 1).padStart(2, '0')
                                const day = String(date.getDate()).padStart(2, '0')
                                const dateString = `${year}-${month}-${day}`
                                setValue("dateOfBirth", dateString, { shouldValidate: true })
                              }
                            }}
                            disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      { label: "Phone Number", value: accountData?.phoneNumber, icon: Phone, type: 'text' },
                      { label: "Date of Birth", value: accountData?.dateOfBirth, icon: CalendarIcon, type: 'text' }
                    ].map((item, index) =>
                      item.value ? (
                        <motion.div
                          key={item.label}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: 0.1 * index }}
                          className="p-4 rounded-xl bg-background/10 backdrop-blur-md border border-primary/20 hover:bg-background/20 hover:border-primary/30 transition-all duration-300 shadow-lg hover:shadow-xl"
                        >
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-gradient-to-r from-primary/30 to-accent/30 backdrop-blur-sm border border-primary/40">
                              <item.icon className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex-1">
                              <p className="text-muted-foreground text-sm font-medium mb-1">{item.label}</p>
                              {item.type === 'link' ? (
                                <a
                                  href={item.value}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:text-primary/80 font-medium break-words hover:underline flex items-center gap-1"
                                >
                                  <span>{item.value}</span>
                                  <ExternalLink className="h-3 w-3 flex-shrink-0" />
                                </a>
                              ) : (
                                <p className="text-foreground font-medium break-words">{item.value}</p>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ) : null
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Social & Professional Links Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="relative group"
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 to-accent/50 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
            <Card className="relative bg-card/40 backdrop-blur-xl border border-border shadow-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10 border-b border-border">
                <CardTitle className="text-card-foreground flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  Social & Professional Links
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                {isEditMode ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {SOCIAL_LINKS.map((social, index) => (
                      <div key={social.platform}>
                        <label className="block text-sm font-medium mb-2 text-foreground">
                          {social.platform}
                        </label>
                        <Input
                          {...register(social.url as keyof UserAccountForm)}
                          type="url"
                          placeholder={`Your ${social.platform} profile URL`}
                          className="bg-background/50 border border-border focus:border-primary text-foreground placeholder:text-muted-foreground backdrop-blur-sm"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    {SOCIAL_LINKS.map((social, index) => {
                      const url = accountData?.[social.url] as string
                      const Icon = getIcon(social.icon)

                      return (
                        <motion.div
                          key={social.platform}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.5, delay: 0.1 * index }}
                          className="flex items-center justify-between p-4 rounded-xl bg-background/10 backdrop-blur-md border border-primary/20 hover:bg-background/20 hover:border-primary/30 transition-all duration-300 shadow-lg hover:shadow-xl group/item"
                        >
                          <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-gradient-to-r from-primary/30 to-accent/30 backdrop-blur-sm border border-primary/40">
                              <Icon className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <span className="text-foreground font-medium">{social.platform}</span>
                              {url && <p className="text-muted-foreground text-sm truncate max-w-40">{url}</p>}
                            </div>
                          </div>
                          {url ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-10 w-10 p-0 text-foreground hover:bg-muted/80 border border-border rounded-full group-hover/item:scale-110 transition-all duration-300 shadow-lg hover:shadow-xl"
                              onClick={() => window.open(url, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Badge variant="secondary" className="bg-muted/50 text-muted-foreground border border-border">Not set</Badge>
                          )}
                        </motion.div>
                      )
                    })}

                    {accountData?.personalWebsiteUrl && (
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center justify-between p-4 rounded-xl bg-background/10 backdrop-blur-md border border-primary/20 hover:bg-background/20 hover:border-primary/30 transition-all duration-300 shadow-lg hover:shadow-xl group/item"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-xl bg-gradient-to-r from-primary/30 to-accent/30 backdrop-blur-sm border border-primary/40">
                            <Globe className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <span className="text-foreground font-medium">Website</span>
                            <p className="text-muted-foreground text-sm truncate max-w-40">{accountData.personalWebsiteUrl}</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-10 w-10 p-0 text-foreground hover:bg-muted/80 border border-border rounded-full group-hover/item:scale-110 transition-all duration-300 shadow-lg hover:shadow-xl"
                          onClick={() => window.open(accountData.personalWebsiteUrl, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </motion.div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </main>
    </div>
  )
} 