import { useState, useEffect, useCallback, useRef } from 'react'
import { projectsApi } from '@/lib/api/project-service'

export function useSharedProjects(projects: Array<{ id: string }>) {
  const [sharedProjectIds, setSharedProjectIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const cacheRef = useRef<Map<string, boolean>>(new Map())
  const lastProjectsRef = useRef<string>('')

  const checkProjectCollaborators = useCallback(async (projectId: string) => {
    // Check cache first
    if (cacheRef.current.has(projectId)) {
      return cacheRef.current.get(projectId)!
    }

    // Collaborators API not available yet; default to false and cache it
    cacheRef.current.set(projectId, false)
    return false
  }, [])

  const refreshSharedProjects = useCallback(async () => {
    if (projects.length === 0) return

    // Create a hash of project IDs to detect changes
    const projectsHash = projects.map(p => p.id).sort().join(',')

    // Only refresh if the projects list has actually changed
    if (lastProjectsRef.current === projectsHash) {
      return
    }

    lastProjectsRef.current = projectsHash

    setIsLoading(true)
    try {
      const sharedIds = new Set<string>()

      // Check each project for collaborators
      const promises = projects.map(async (project) => {
        const hasCollaborators = await checkProjectCollaborators(project.id)
        if (hasCollaborators) {
          sharedIds.add(project.id)
        }
      })

      await Promise.all(promises)
      setSharedProjectIds(sharedIds)
    } catch (error) {
      console.error('Error refreshing shared projects:', error)
    } finally {
      setIsLoading(false)
    }
  }, [projects, checkProjectCollaborators])

  const isProjectShared = useCallback((projectId: string) => {
    return sharedProjectIds.has(projectId)
  }, [sharedProjectIds])

  const markProjectAsShared = useCallback((projectId: string) => {
    setSharedProjectIds(prev => new Set([...prev, projectId]))
    cacheRef.current.set(projectId, true)
  }, [])

  const markProjectAsNotShared = useCallback((projectId: string) => {
    setSharedProjectIds(prev => {
      const newSet = new Set(prev)
      newSet.delete(projectId)
      return newSet
    })
    cacheRef.current.set(projectId, false)
  }, [])

  // Refresh shared projects when projects list changes
  useEffect(() => {
    refreshSharedProjects()
  }, [refreshSharedProjects])

  return {
    isProjectShared,
    sharedProjectIds,
    isLoading,
    refreshSharedProjects,
    markProjectAsShared,
    markProjectAsNotShared
  }
} 