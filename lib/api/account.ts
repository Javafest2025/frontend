import { getApiUrl } from "@/lib/config/api-config"
import { authenticatedFetch, getUserData } from "./auth"
import { UserAccount, UserAccountForm } from "@/types/account"

export const accountApi = {
  // Get user account information
  getAccount: async (): Promise<UserAccount | null> => {
    try {
      const response = await authenticatedFetch(getApiUrl("/api/v1/account"))

      if (!response.ok) {
        throw new Error(`Failed to fetch account: ${response.statusText}`)
      }

      const data = await response.json()
      return data.data
    } catch (error) {
      console.error("Get account error:", error)
      return null
    }
  },

  // Update user account information
  updateAccount: async (accountData: Partial<UserAccountForm>): Promise<{ success: boolean, data?: UserAccount, message?: string }> => {
    try {
      const response = await authenticatedFetch(getApiUrl("/api/v1/account"), {
        method: "PATCH",
        body: JSON.stringify(accountData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to update account")
      }

      return {
        success: true,
        data: data.data,
        message: data.message
      }
    } catch (error) {
      console.error("Update account error:", error)
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to update account"
      }
    }
  },

  // Upload profile image
  uploadProfileImage: async (file: File): Promise<{ success: boolean, url?: string, message?: string }> => {
    try {
      const userData = getUserData()
      if (!userData?.id) {
        throw new Error("User not authenticated")
      }

      const formData = new FormData()
      formData.append("profileImage", file)
      formData.append("userId", userData.id)

      const response = await fetch("/api/b2/profile-upload", {
        method: "POST",
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload profile image")
      }

      // Update the user account with the new profile image URL
      const updateResult = await authenticatedFetch(getApiUrl("/api/v1/account"), {
        method: "PATCH",
        body: JSON.stringify({
          profileImageUrl: data.downloadUrl,
          profileImageFilename: data.fileName
        })
      })

      if (!updateResult.ok) {
        throw new Error("Failed to update account with profile image URL")
      }

      return {
        success: true,
        url: data.downloadUrl,
        message: "Profile image uploaded successfully"
      }
    } catch (error) {
      console.error("Upload profile image error:", error)
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to upload profile image"
      }
    }
  },

  // Delete profile image
  deleteProfileImage: async (): Promise<{ success: boolean, message?: string }> => {
    try {
      const response = await authenticatedFetch(getApiUrl("/api/v1/account/profile-image"), {
        method: "DELETE"
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete profile image")
      }

      return {
        success: true,
        message: data.message
      }
    } catch (error) {
      console.error("Delete profile image error:", error)
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to delete profile image"
      }
    }
  }
} 