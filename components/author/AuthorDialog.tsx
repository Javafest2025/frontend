"use client";

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  User, 
  Building, 
  Citation, 
  BookOpen, 
  Calendar, 
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface AuthorData {
  name: string;
  primaryAffiliation: string;
  allAffiliations: string[];
  semanticScholarId: string;
  orcidId: string;
  googleScholarId?: string;
  openalexId: string;
  citationCount: number;
  hIndex: number;
  i10Index: number;
  paperCount: number;
  firstPublicationYear?: number;
  lastPublicationYear?: number;
  researchAreas: string[];
  recentPublications: any[];
  dataSources: string[];
  dataQualityScore: number;
  isSynced: boolean;
  lastSyncAt?: string;
  syncError?: string;
}

interface AuthorDialogProps {
  authorName: string;
  children: React.ReactNode;
}

export function AuthorDialog({ authorName, children }: AuthorDialogProps) {
  const [authorData, setAuthorData] = useState<AuthorData | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [open, setOpen] = useState(false);

  const fetchAuthorData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/v1/authors/fetch/${encodeURIComponent(authorName)}?strategy=fast`);
      const result = await response.json();
      
      if (result.success) {
        setAuthorData(result.data);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch author information",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect to author service",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const syncAuthorData = async (forceRefresh: boolean = false) => {
    if (!forceRefresh && authorData?.isSynced) {
      const confirmed = confirm(
        "Author data is up to date. Do you want to refresh anyway?"
      );
      if (!confirmed) return;
    }

    setSyncing(true);
    try {
      const response = await fetch('/api/v1/authors/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: authorName,
          strategy: 'comprehensive',
          forceRefresh: true,
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setAuthorData(result.data);
        toast({
          title: "Success",
          description: `Author synchronized from ${result.data.dataSources.length} sources`,
        });
      } else {
        toast({
          title: "Sync Error",
          description: result.message || "Failed to sync author data",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Sync Error",
        description: "Failed to sync author data",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen && !authorData) {
      fetchAuthorData();
    }
  };

  const getSyncStatusColor = () => {
    if (authorData?.syncError) return "destructive";
    if (authorData?.isSynced) return "default";
    return "secondary";
  };

  const getSyncStatusText = () => {
    if (authorData?.syncError) return "Sync Error";
    if (authorData?.isSynced) return "Synced";
    return "Not Synced";
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {authorName}
          </DialogTitle>
          <DialogDescription>
            Comprehensive author information from multiple academic sources
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading author information...</span>
          </div>
        ) : authorData ? (
          <ScrollArea className="max-h-[70vh]">
            <div className="space-y-6">
              {/* Header with sync status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant={getSyncStatusColor()}>
                    {authorData.isSynced ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <AlertCircle className="h-3 w-3 mr-1" />}
                    {getSyncStatusText()}
                  </Badge>
                  {authorData.lastSyncAt && (
                    <Badge variant="outline">
                      <Clock className="h-3 w-3 mr-1" />
                      Last sync: {new Date(authorData.lastSyncAt).toLocaleDateString()}
                    </Badge>
                  )}
                  <Badge variant="outline">
                    Quality: {(authorData.dataQualityScore * 100).toFixed(0)}%
                  </Badge>
                </div>
                <Button 
                  onClick={() => syncAuthorData(false)} 
                  disabled={syncing}
                  size="sm"
                  variant="outline"
                >
                  {syncing ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Sync
                </Button>
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold flex items-center gap-2 mb-2">
                      <Building className="h-4 w-4" />
                      Affiliations
                    </h3>
                    <p className="text-sm font-medium">{authorData.primaryAffiliation}</p>
                    {authorData.allAffiliations.length > 1 && (
                      <div className="mt-2 space-y-1">
                        <p className="text-xs text-muted-foreground">All affiliations:</p>
                        {authorData.allAffiliations.slice(0, 3).map((affiliation, index) => (
                          <Badge key={index} variant="outline" className="text-xs mr-1 mb-1">
                            {affiliation}
                          </Badge>
                        ))}
                        {authorData.allAffiliations.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{authorData.allAffiliations.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="font-semibold flex items-center gap-2 mb-2">
                      <Citation className="h-4 w-4" />
                      Metrics
                    </h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>Citations: <span className="font-medium">{authorData.citationCount.toLocaleString()}</span></div>
                      <div>H-index: <span className="font-medium">{authorData.hIndex}</span></div>
                      <div>Papers: <span className="font-medium">{authorData.paperCount}</span></div>
                      <div>i10-index: <span className="font-medium">{authorData.i10Index}</span></div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold flex items-center gap-2 mb-2">
                      <Calendar className="h-4 w-4" />
                      Career Timeline
                    </h3>
                    {authorData.firstPublicationYear && authorData.lastPublicationYear ? (
                      <div className="text-sm">
                        <p>{authorData.firstPublicationYear} - {authorData.lastPublicationYear}</p>
                        <p className="text-muted-foreground">
                          {authorData.lastPublicationYear - authorData.firstPublicationYear} years active
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Timeline not available</p>
                    )}
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">External Profiles</h3>
                    <div className="space-y-1">
                      {authorData.orcidId && (
                        <a 
                          href={`https://orcid.org/${authorData.orcidId}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          ORCID: {authorData.orcidId}
                        </a>
                      )}
                      {authorData.semanticScholarId && (
                        <a 
                          href={`https://www.semanticscholar.org/author/${authorData.semanticScholarId}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Semantic Scholar
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Research Areas */}
              {authorData.researchAreas.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Research Areas</h3>
                  <div className="flex flex-wrap gap-1">
                    {authorData.researchAreas.map((area, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {area}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Publications */}
              {authorData.recentPublications.length > 0 && (
                <div>
                  <h3 className="font-semibold flex items-center gap-2 mb-3">
                    <BookOpen className="h-4 w-4" />
                    Recent Publications
                  </h3>
                  <div className="space-y-3">
                    {authorData.recentPublications.slice(0, 5).map((pub, index) => (
                      <div key={index} className="border-l-2 border-muted pl-4">
                        <h4 className="text-sm font-medium leading-tight mb-1">
                          {pub.title}
                        </h4>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{pub.year}</span>
                          {pub.journal && <span>{pub.journal}</span>}
                          {pub.citations > 0 && <span>{pub.citations} citations</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Data Sources */}
              <div>
                <h3 className="font-semibold mb-2">Data Sources</h3>
                <div className="flex flex-wrap gap-1">
                  {authorData.dataSources.map((source, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {source.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Failed to load author information
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
