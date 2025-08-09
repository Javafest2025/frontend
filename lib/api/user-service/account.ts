import { getMicroserviceUrl } from "@/lib/config/api-config"
import { authenticatedFetch, getUserData } from "./auth"
import { UserAccount, UserAccountForm } from "@/types/account"

// Helper function to map backend profile data to frontend UserAccount structure
const mapProfileDataToUserAccount = (profileData: any): UserAccount => {
    // Helper function to convert ISO date to YYYY-MM-DD format
    const formatDateForForm = (dateString: string | null | undefined): string => {
        if (!dateString) return ""
        try {
            const date = new Date(dateString)
            if (isNaN(date.getTime())) return ""
            const year = date.getFullYear()
            const month = String(date.getMonth() + 1).padStart(2, '0')
            const day = String(date.getDate()).padStart(2, '0')
            return `${year}-${month}-${day}`
        } catch (error) {
            console.error("Error formatting date:", error)
            return ""
        }
    }

    return {
        id: profileData.id || profileData.userId || "",
        userId: profileData.userId || "",
        email: profileData.email || "",
        createdAt: profileData.createdAt || "",
        updatedAt: profileData.updatedAt || "",
        fullName: profileData.fullName || "",
        avatarUrl: profileData.avatarUrl || "",
        phoneNumber: profileData.phoneNumber || "",
        dateOfBirth: formatDateForForm(profileData.dateOfBirth),
        bio: profileData.bio || "",
        affiliation: profileData.affiliation || "",
        positionTitle: profileData.positionTitle || "",
        researchInterests: profileData.researchInterests || "",
        googleScholarUrl: profileData.googleScholarUrl || "",
        personalWebsiteUrl: profileData.personalWebsiteUrl || "",
        orcidId: profileData.orcidId || "",
        linkedInUrl: profileData.linkedInUrl || "",
        twitterUrl: profileData.twitterUrl || ""
    }
}

export const accountApi = {
    // Get user account information
    getAccount: async (): Promise<UserAccount | null> => {
        try {
            console.log("🔍 Fetching account information...");
            const response = await authenticatedFetch(getMicroserviceUrl("user-service", "/api/v1/profile"))

            console.log("📊 Account response status:", response.status, response.statusText);

            if (!response.ok) {
                const errorText = await response.text();
                console.error("❌ Account fetch failed:", response.status, errorText);
                throw new Error(`Failed to fetch account: ${response.status} ${response.statusText}`)
            }

            const data = await response.json()
            console.log("✅ Account data received:", data);
            return data.data ? mapProfileDataToUserAccount(data.data) : null
        } catch (error) {
            console.error("Get account error:", error)
            return null
        }
    },

    // Update user account information
    updateAccount: async (accountData: Partial<UserAccountForm>): Promise<{ success: boolean, data?: UserAccount, message?: string }> => {
        try {
            const response = await authenticatedFetch(getMicroserviceUrl("user-service", "/api/v1/profile"), {
                method: "PATCH",
                body: JSON.stringify(accountData)
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.message || "Failed to update account")
            }

            return {
                success: true,
                data: data.data ? mapProfileDataToUserAccount(data.data) : undefined,
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

    // Upload profile image using presigned URL
    uploadProfileImage: async (file: File): Promise<{ success: boolean, url?: string, message?: string }> => {
        try {
            // Validate file type
            const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
            if (!allowedTypes.includes(file.type)) {
                throw new Error("Please upload a valid image file (JPEG, PNG, or WebP)");
            }

            // Validate file size (5MB)
            if (file.size > 5 * 1024 * 1024) {
                throw new Error("Image size must be less than 5MB");
            }

            // Step 1: Get presigned upload URL
            const uploadUrlResponse = await authenticatedFetch(
                getMicroserviceUrl("user-service", `/api/v1/users/me/avatar/upload-url?contentType=${encodeURIComponent(file.type)}&contentLength=${file.size}`),
                { method: "POST" }
            );

            if (!uploadUrlResponse.ok) {
                const errorData = await uploadUrlResponse.json();
                throw new Error(errorData.message || "Failed to get upload URL");
            }

            const uploadUrlData = await uploadUrlResponse.json();
            const { putUrl, key, publicUrl } = uploadUrlData.data;

            // Step 2: Upload file directly to B2 using presigned URL
            const uploadResponse = await fetch(putUrl, {
                method: "PUT",
                headers: {
                    "Content-Type": file.type,
                },
                body: file
            });

            if (!uploadResponse.ok) {
                throw new Error("Failed to upload image to storage");
            }

            // Step 3: Get ETag from response headers
            const etag = uploadResponse.headers.get("ETag") || "";

            // Step 4: Commit the avatar
            const commitResponse = await authenticatedFetch(
                getMicroserviceUrl("user-service", "/api/v1/users/me/avatar/commit"),
                {
                    method: "PATCH",
                    body: JSON.stringify({ key, etag })
                }
            );

            if (!commitResponse.ok) {
                const errorData = await commitResponse.json();
                throw new Error(errorData.message || "Failed to commit avatar");
            }

            return {
                success: true,
                url: publicUrl,
                message: "Profile image uploaded successfully"
            };
        } catch (error) {
            console.error("Upload profile image error:", error);
            return {
                success: false,
                message: error instanceof Error ? error.message : "Failed to upload profile image"
            };
        }
    },

    // Delete profile image
    deleteProfileImage: async (): Promise<{ success: boolean, message?: string }> => {
        try {
            const response = await authenticatedFetch(
                getMicroserviceUrl("user-service", "/api/v1/users/me/avatar"),
                { method: "DELETE" }
            );

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || "Failed to delete profile image");
            }

            return {
                success: true,
                message: "Profile image deleted successfully"
            };
        } catch (error) {
            console.error("Delete profile image error:", error);
            return {
                success: false,
                message: error instanceof Error ? error.message : "Failed to delete profile image"
            };
        }
    }
}
