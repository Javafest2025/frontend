import { getMicroserviceUrl } from "@/lib/config/api-config"
import { authenticatedFetch } from "./auth"
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

                // Handle specific error cases
                if (response.status === 401) {
                    console.log("🔄 Unauthorized - authentication failed");
                    // The authenticatedFetch function should have already handled token refresh
                    // If we still get 401, it means the refresh token is invalid
                    return null;
                }

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
            console.log("📤 Sending account update data:", accountData);

            // Process data for backend compatibility
            const processedData = { ...accountData };

            // Convert dateOfBirth from YYYY-MM-DD to ISO string for backend
            if (processedData.dateOfBirth && processedData.dateOfBirth.trim() !== "") {
                try {
                    // Parse the YYYY-MM-DD date and convert to ISO string
                    const date = new Date(processedData.dateOfBirth + 'T00:00:00.000Z');
                    processedData.dateOfBirth = date.toISOString();
                    console.log("📅 Converted dateOfBirth:", processedData.dateOfBirth);
                } catch (error) {
                    console.error("❌ Error converting dateOfBirth:", error);
                    // Remove invalid date to avoid backend validation errors
                    delete processedData.dateOfBirth;
                }
            }

            // Remove empty string values for URL fields to avoid validation errors
            const urlFields = ['googleScholarUrl', 'personalWebsiteUrl', 'linkedInUrl', 'twitterUrl', 'avatarUrl'];
            urlFields.forEach(field => {
                if (processedData[field as keyof typeof processedData] === '') {
                    delete processedData[field as keyof typeof processedData];
                }
            });

            // Remove empty string values for other fields that might cause validation issues
            const otherFields = ['phoneNumber', 'orcidId'];
            otherFields.forEach(field => {
                if (processedData[field as keyof typeof processedData] === '') {
                    delete processedData[field as keyof typeof processedData];
                }
            });

            console.log("📤 Processed data for backend:", processedData);

            const response = await authenticatedFetch(getMicroserviceUrl("user-service", "/api/v1/profile"), {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(processedData)
            })

            console.log("📊 Update response status:", response.status, response.statusText);

            if (!response.ok) {
                const errorText = await response.text();
                console.error("❌ Update failed:", response.status, errorText);

                let errorMessage = "Failed to update account";
                try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.message || errorData.error || errorMessage;
                } catch (parseError) {
                    errorMessage = errorText || errorMessage;
                }

                throw new Error(errorMessage);
            }

            const data = await response.json();
            console.log("✅ Update response data:", data);

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

    // Upload profile image via multipart to backend (Cloudinary)
    uploadProfileImage: async (file: File): Promise<{ success: boolean, url?: string, message?: string }> => {
        try {
            // Validate file type
            const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
            if (!allowedTypes.includes(file.type)) {
                throw new Error("Please upload a valid image file (JPEG, PNG, or WebP)");
            }

            // Send directly to user-service as multipart
            const form = new FormData();
            form.append("file", file);

            const resp = await authenticatedFetch(
                getMicroserviceUrl("user-service", "/api/v1/users/me/avatar"),
                { method: "POST", body: form }
            );

            if (!resp.ok) {
                if (resp.status === 413) {
                    return {
                        success: false,
                        message: "Image file is too large. Please choose a smaller image."
                    };
                }

                // Try to parse response data, but handle cases where response might not be JSON
                let data;
                try {
                    data = await resp.json();
                } catch (parseError) {
                    // If response is not JSON, use status text
                    return {
                        success: false,
                        message: `Upload failed: ${resp.statusText || 'Unknown error'}`
                    };
                }

                // Handle other specific error cases
                if (data?.message) {
                    if (data.message.includes("File size") || data.message.includes("3MB")) {
                        return {
                            success: false,
                            message: "Image file is too large. Please choose an image smaller than 3MB."
                        };
                    }
                    return {
                        success: false,
                        message: data.message
                    };
                }
                return {
                    success: false,
                    message: "Failed to upload avatar"
                };
            }

            const data = await resp.json();

            const url: string | undefined = data?.data?.url || data?.data?.secure_url || data?.data?.avatarUrl;
            return { success: true, url, message: data?.message || "Profile image uploaded successfully" };
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
            const response = await authenticatedFetch(getMicroserviceUrl("user-service", "/api/v1/users/me/avatar"), { method: "DELETE" });

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
