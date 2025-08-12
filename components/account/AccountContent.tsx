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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { toast } from "sonner"
import { format } from "date-fns"
import {
  User,
  GraduationCap,
  Settings,
  Camera,
  Save,
  Edit3,
  ExternalLink,
  Globe,
  Mail,
  Phone,
  Calendar as CalendarIcon,
  Briefcase,
  Loader2,
  Eye,
  BookOpen,
  Target,
  Building,
  Award,
  ChevronDown,
  Linkedin,
  Twitter
} from "lucide-react"
import { accountApi, getUserData } from "@/lib/api/user-service"
import { UserAccount, UserAccountForm } from "@/types/account"
import { ACCOUNT_SECTIONS, SOCIAL_LINKS } from "@/constants/account"
import { cn } from "@/lib/utils/cn"

// Custom Calendar Component with Year/Month Picker
interface EnhancedCalendarProps {
  selected?: Date
  onSelect?: (date: Date | undefined) => void
  disabled?: (date: Date) => boolean
  className?: string
}

function EnhancedCalendar({ selected, onSelect, disabled, className }: EnhancedCalendarProps) {
  const [currentDate, setCurrentDate] = useState(selected || new Date())
  const [isYearPickerOpen, setIsYearPickerOpen] = useState(false)
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false)

  // Update currentDate when selected changes
  useEffect(() => {
    if (selected) {
      setCurrentDate(selected)
    }
  }, [selected])

  // Generate years from 1900 to current year
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: currentYear - 1900 + 1 }, (_, i) => currentYear - i)

  // Generate months
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  const handleYearChange = (year: string) => {
    const newDate = new Date(currentDate)
    newDate.setFullYear(parseInt(year))
    setCurrentDate(newDate)
    setIsYearPickerOpen(false)
  }

  const handleMonthChange = (month: string) => {
    const newDate = new Date(currentDate)
    newDate.setMonth(months.indexOf(month))
    setCurrentDate(newDate)
    setIsMonthPickerOpen(false)
  }

  return (
    <div className={cn("p-3", className)}>
      {/* Year/Month Picker Header */}
      <div className="flex items-center justify-between mb-4">
        {/* Year Picker */}
        <Popover open={isYearPickerOpen} onOpenChange={setIsYearPickerOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="h-8 px-2 text-sm bg-background/50 border-2 border-primary/20 hover:border-primary/40"
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
                  className="w-full justify-start text-sm hover:bg-primary/10 border-b border-primary/10"
                  onClick={() => handleYearChange(year.toString())}
                >
                  {year}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Month Picker */}
        <Popover open={isMonthPickerOpen} onOpenChange={setIsMonthPickerOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="h-8 px-2 text-sm bg-background/50 border-2 border-primary/20 hover:border-primary/40"
            >
              {months[currentDate.getMonth()]}
              <ChevronDown className="ml-1 h-3 w-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-0 bg-background/95 backdrop-blur-xl border-2 border-primary/20 shadow-xl">
            <div className="grid grid-cols-1">
              {months.map((month) => (
                <Button
                  key={month}
                  variant="ghost"
                  className="w-full justify-start text-sm hover:bg-primary/10 border-b border-primary/10"
                  onClick={() => handleMonthChange(month)}
                >
                  {month}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Calendar */}
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
            "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-primary/10 rounded-md transition-colors"
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
  const [isUpdating, setIsUpdating] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")

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

        if (account === null) {
          // Account fetch returned null, which means authentication failed
          console.log("🔄 Authentication failed, redirecting to login");
          // Clear any stale auth data
          clearAuthData();
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
      setActiveTab("overview")
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
          // Special handling for dateOfBirth - convert to ISO 8601 format
          if (fieldKey === 'dateOfBirth' && newValue) {
            try {
              // Parse the date string (YYYY-MM-DD) and convert to ISO 8601
              const [year, month, day] = newValue.split('-').map(Number)
              if (year && month && day) {
                // Create date in local timezone (month is 0-indexed)
                const date = new Date(year, month - 1, day)
                // Convert to ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)
                updateData[fieldKey] = date.toISOString()
              } else {
                updateData[fieldKey] = newValue
              }
            } catch (error) {
              console.error("Error parsing date:", error)
              updateData[fieldKey] = newValue
            }
          } else {
            updateData[fieldKey] = newValue
          }
        }
      })

      const result = await accountApi.updateAccount(updateData)

      if (result.success) {
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
        setActiveTab("overview")
        toast.success("Profile updated successfully")
      } else {
        toast.error(result.message || "Failed to update profile")
      }
    } catch (error) {
      console.error("Failed to update account:", error)
      toast.error("Failed to update profile")
    } finally {
      setIsUpdating(false)
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
    setActiveTab("overview")
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploadingImage(true)
    try {
      const result = await accountApi.uploadProfileImage(file)
      if (result.success) {
        setAccountData(prev => prev ? { ...prev, avatarUrl: result.url } : null)
        toast.success("Profile image updated successfully")
      } else {
        toast.error(result.message || "Failed to upload image")
      }
    } catch (error) {
      console.error("Failed to upload image:", error)
      toast.error("Failed to upload image")
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleImageDelete = async () => {
    try {
      const result = await accountApi.deleteProfileImage()
      if (result.success) {
        setAccountData(prev => prev ? { ...prev, avatarUrl: undefined } : null)
        toast.success("Profile image removed successfully")
      } else {
        toast.error(result.message || "Failed to remove image")
      }
    } catch (error) {
      console.error("Failed to delete image:", error)
      toast.error("Failed to remove image")
    }
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

  const renderDetailItem = (label: string, value?: string | null, icon?: React.ReactNode, type: 'text' | 'link' = 'text') => {
    if (!value) return null

    return (
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-3 p-4 rounded-lg bg-background/50 border-2 border-primary/10 hover:bg-primary/5 hover:border-primary/30 transition-all duration-200 shadow-sm"
      >
        {icon && <div className="text-primary p-2 rounded-full bg-primary/10 border border-primary/20">{icon}</div>}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground font-medium">{label}</p>
          {type === 'link' ? (
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary hover:underline group flex items-center gap-1"
            >
              <span>{value}</span>
              <ExternalLink className="h-3 w-3 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
            </a>
          ) : (
            <p className="font-medium break-words text-foreground">{value}</p>
          )}
        </div>
      </motion.div>
    );
  };

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
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 relative">
      {/* Animated Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Header - Sticky */}
      <div
        className="sticky top-0 z-50 border-b-2 border-primary/20 bg-background/95 backdrop-blur-xl shadow-lg"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent flex items-center gap-3">
                  <div className="p-2 rounded-full bg-gradient-to-r from-primary to-purple-500 text-white shadow-lg">
                    <User className="h-5 w-5" />
                  </div>
                  Account Settings
                </h1>
                <p className="text-muted-foreground mt-1 text-base">
                  {isEditMode ? "Edit your profile and account preferences" : "View and manage your profile information"}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {!isEditMode ? (
                  <Button
                    onClick={() => {
                      setIsEditMode(true)
                      setActiveTab("edit")
                    }}
                    className="gradient-primary-to-accent text-white shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-primary/30"
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
                      className="hover:bg-background/80 border-2 border-primary/20"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSubmit(onSubmit)}
                      disabled={isUpdating}
                      className="gradient-primary-to-accent text-white shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-primary/30"
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
      </div>

      {/* Main Content Area */}
      <main className="relative z-10 container mx-auto p-6 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Column - Profile Overview */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:col-span-1 space-y-6"
          >
            {/* Profile Overview Card */}
            <Card className="bg-background/40 backdrop-blur-xl border-2 border-primary/20 shadow-xl hover:shadow-2xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  {/* Avatar Section */}
                  <div className="relative mb-6">
                    <div className="relative">
                      <Avatar className="h-32 w-32 border-4 border-primary/30 shadow-2xl">
                        <AvatarImage
                          src={accountData?.avatarUrl || ""}
                          alt="Profile picture"
                          className="object-cover"
                        />
                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-purple-500/20 text-2xl font-bold">
                          <GraduationCap className="h-8 w-8 text-primary" />
                        </AvatarFallback>
                      </Avatar>

                      {/* Upload Overlay */}
                      {isUploadingImage && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-full">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                      )}

                      {/* Upload Button */}
                      <Button
                        size="sm"
                        className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0 gradient-primary-to-accent shadow-lg border-2 border-white"
                        onClick={() => document.getElementById('profile-image-upload')?.click()}
                        disabled={isUploadingImage}
                      >
                        <Camera className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Hidden file input */}
                    <input
                      id="profile-image-upload"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={isUploadingImage}
                    />
                  </div>

                  {/* User Info */}
                  <div className="space-y-2 mb-6">
                    <h3 className="font-bold text-xl bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                      {accountData?.fullName || "Add your name"}
                    </h3>
                    <p className="text-muted-foreground text-sm flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {userData?.email}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Social Links */}
            <Card className="bg-background/40 backdrop-blur-xl border-2 border-primary/20 shadow-xl hover:shadow-2xl transition-all duration-300">
              <CardHeader className="border-b-2 border-primary/10">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  Social & Professional Links
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-4">
                {SOCIAL_LINKS.map((social) => {
                  const url = accountData?.[social.url] as string
                  const Icon = getIcon(social.icon)

                  return (
                    <motion.div
                      key={social.platform}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-3 rounded-lg border border-primary/10 hover:bg-primary/5 hover:border-primary/30 transition-all duration-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/20">
                          <Icon className={cn("h-4 w-4", social.color)} />
                        </div>
                        <span className="text-sm font-medium">{social.platform}</span>
                      </div>
                      {url ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 px-2 hover:bg-primary/10 border border-primary/20"
                          onClick={() => window.open(url, '_blank')}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      ) : (
                        <Badge variant="secondary" className="text-xs border border-primary/20">Not set</Badge>
                      )}
                    </motion.div>
                  )
                })}

                {accountData?.personalWebsiteUrl && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-3 rounded-lg border border-primary/10 hover:bg-primary/5 hover:border-primary/30 transition-all duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/20">
                        <Globe className="h-4 w-4 text-green-500" />
                      </div>
                      <span className="text-sm font-medium">Website</span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2 hover:bg-primary/10 border border-primary/20"
                      onClick={() => window.open(accountData.personalWebsiteUrl, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Right Column - Main Content */}
          <div className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={(value) => {
              setActiveTab(value)
              setIsEditMode(value === "edit")
            }} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-background/40 backdrop-blur-xl border-2 border-primary/20 shadow-lg">
                <TabsTrigger value="overview" className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="edit" className="flex items-center gap-2">
                  <Edit3 className="h-4 w-4" />
                  Edit Profile
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key="overview-view"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    {/* About Section */}
                    {accountData?.bio && (
                      <Card className="bg-background/40 backdrop-blur-xl border-2 border-primary/20 shadow-xl hover:shadow-2xl transition-all duration-300">
                        <CardHeader className="border-b-2 border-primary/10">
                          <CardTitle className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-primary" />
                            About
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                          <p className="text-muted-foreground leading-relaxed">{accountData.bio}</p>
                        </CardContent>
                      </Card>
                    )}

                    {/* Professional Details Section */}
                    <Card className="bg-background/40 backdrop-blur-xl border-2 border-primary/20 shadow-xl hover:shadow-2xl transition-all duration-300">
                      <CardHeader className="border-b-2 border-primary/10">
                        <CardTitle className="flex items-center gap-2">
                          <Award className="h-5 w-5 text-primary" />
                          Professional & Academic
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {renderDetailItem("Affiliation", accountData?.affiliation, <Building size={16} />)}
                          {renderDetailItem("Position", accountData?.positionTitle, <Briefcase size={16} />)}
                          {renderDetailItem("Research Interests", accountData?.researchInterests, <BookOpen size={16} />)}
                          {renderDetailItem("ORCID iD", accountData?.orcidId, <Target size={16} />)}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Contact Details Section */}
                    <Card className="bg-background/40 backdrop-blur-xl border-2 border-primary/20 shadow-xl hover:shadow-2xl transition-all duration-300">
                      <CardHeader className="border-b-2 border-primary/10">
                        <CardTitle className="flex items-center gap-2">
                          <Mail className="h-5 w-5 text-primary" />
                          Contact Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {renderDetailItem("Phone Number", accountData?.phoneNumber, <Phone size={16} />)}
                          {renderDetailItem("Date of Birth", accountData?.dateOfBirth, <CalendarIcon size={16} />)}
                          {renderDetailItem("Website", accountData?.personalWebsiteUrl, <Globe size={16} />, 'link')}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </AnimatePresence>
              </TabsContent>

              <TabsContent value="edit" className="mt-6">
                <motion.div
                  key="edit-form"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {/* Edit Form Content */}
                  {ACCOUNT_SECTIONS.map((section) => {
                    const Icon = getIcon(section.icon)

                    return (
                      <Card key={section.id} className="bg-background/40 backdrop-blur-xl border-2 border-primary/20 shadow-xl hover:shadow-2xl transition-all duration-300">
                        <CardHeader className="border-b-2 border-primary/10">
                          <CardTitle className="flex items-center gap-2">
                            <Icon className="h-5 w-5 text-primary" />
                            {section.title}
                          </CardTitle>
                          <CardDescription>{section.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 p-6">
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
                                    className="min-h-[100px] bg-background/50 border-2 border-primary/20 focus:border-primary"
                                  />
                                ) : field.type === 'select' ? (
                                  <Select
                                    value={watch(field.name) || ""}
                                    onValueChange={(value) => setValue(field.name, value)}
                                  >
                                    <SelectTrigger className="bg-background/50 border-2 border-primary/20 focus:border-primary">
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
                                ) : field.name === 'dateOfBirth' ? (
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button
                                        variant="outline"
                                        className={cn(
                                          "w-full justify-start text-left font-normal bg-background/50 border-2 border-primary/20 focus:border-primary hover:bg-background/70 transition-all duration-300",
                                          !watch(field.name) && "text-muted-foreground"
                                        )}
                                      >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {watch(field.name) ? (
                                          (() => {
                                            try {
                                              // Parse the date string properly to avoid timezone issues
                                              const [year, month, day] = watch(field.name).split('-').map(Number)
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
                                    <PopoverContent className="w-auto p-0 bg-background/95 backdrop-blur-xl border-2 border-primary/20 shadow-xl" align="start">
                                      <EnhancedCalendar
                                        selected={(() => {
                                          const dateValue = watch(field.name)
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
                                            setValue(field.name, dateString, { shouldValidate: true })
                                          }
                                        }}
                                        disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                                      />
                                    </PopoverContent>
                                  </Popover>
                                ) : (
                                  <Input
                                    {...register(field.name, { required: field.required })}
                                    type={field.type}
                                    placeholder={field.placeholder}
                                    className="bg-background/50 border-2 border-primary/20 focus:border-primary"
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
                            <div className="border-t-2 border-primary/20 pt-6">
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
                                      className="bg-background/50 border-2 border-primary/20 focus:border-primary"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </motion.div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  )
} 