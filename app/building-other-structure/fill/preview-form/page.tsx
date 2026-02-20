"use client";

import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import "@/app/styles/forms-fill.css";
import Link from "next/link";
import { useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Send } from "lucide-react";

// Helper function to collect form data from localStorage
function collectFormData() {
  const data: any = {};
  
  // Iterate through all localStorage items and collect form data
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      const value = localStorage.getItem(key);
      
      // Map localStorage keys to API field names
      if (key && (key.includes('_p1') || key.includes('_p2') || key.includes('_p3') || key.includes('_p4') || key.includes('_p5'))) {
        // Remove the page suffix (_p1, _p2, etc.) from the key
        const cleanKey = key.replace(/_p[0-9]$/, '');
        
        // Convert to snake_case for API
        const apiKey = cleanKey;
        
        // Special handling for JSON data that should be parsed
        if (value && (apiKey.includes('flooring_material') || apiKey.includes('wall_material'))) {
          try {
            data[apiKey] = JSON.parse(value);
          } catch (e) {
            console.warn(`Failed to parse JSON for ${apiKey}:`, value);
            data[apiKey] = value;
          }
        } else {
          data[apiKey] = value;
        }
      }
    }
  }
  
  return data;
}

export default function PreviewFormPage() {
  const router = useRouter();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeHeight, setIframeHeight] = useState<string | number>('100vh');
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePrint = () => {
    const iframe = iframeRef.current;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    }
  };

  const handleIframeLoad = useCallback(() => {
    const iframe = iframeRef.current;
    if (iframe && iframe.contentWindow) {
      setTimeout(() => {
        const height = iframe.contentWindow?.document.body.scrollHeight;
        if (height) {
          setIframeHeight(`${height + 50}px`);
        }
      }, 500);
    }
  }, []);

  const handleSaveDraft = useCallback(async () => {
    setIsSaving(true);
    try {
      const formData = collectFormData();
      formData.status = 'draft';
      
      // Check if we're editing an existing draft
      const draftId = localStorage.getItem('draft_id');
      
      let response;
      if (draftId) {
        // Update existing draft
        response = await fetch(`/api/building-structure/${draftId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
      } else {
        // Create new draft
        response = await fetch('/api/building-structure', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
      }

      if (response.ok) {
        const result = await response.json();
        alert(`Draft ${draftId ? 'updated' : 'saved'} successfully! ID: ` + result.data?.id);
        // Clear localStorage after successful save
        localStorage.clear();
        router.push('/building-other-structure/dashboard');
      } else {
        const error = await response.json();
        alert('Failed to save draft: ' + (error.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      alert('Error saving draft. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [router]);

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    try {
      const formData = collectFormData();
      formData.status = 'pending'; // Set status to pending for submission
      
      // Check if we're editing an existing draft
      const draftId = localStorage.getItem('draft_id');
      
      let response;
      if (draftId) {
        // Update existing draft and submit
        response = await fetch(`/api/building-structure/${draftId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
      } else {
        // Create new submission
        response = await fetch('/api/building-structure', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
      }

      if (response.ok) {
        const result = await response.json();
        alert('Form submitted successfully! ID: ' + result.data?.id);
        // Clear localStorage after successful submission
        localStorage.clear();
        router.push('/building-other-structure/dashboard');
      } else {
        const error = await response.json();
        alert('Failed to submit form: ' + (error.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Error submitting form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [router]);

  return (
    <SidebarProvider>
      <AppSidebar />

      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />

          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/building-other-structure">Building & Other Structures</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Preview & Submit</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex-1 p-6 overflow-y-auto">
          <div className="rpfaas-fill max-w-5xl mx-auto">
            <header className="rpfaas-fill-header flex items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="rpfaas-fill-title">Preview & Submit</h1>
                <p className="text-sm text-muted-foreground">Review your form before submitting or save as draft.</p>
              </div>
              <div className="hidden sm:flex gap-2">
                <Button onClick={handlePrint} variant="outline" className="rpfaas-fill-button">
                  Print
                </Button>
              </div>
            </header>

            <div className="bg-white shadow-sm border p-6 mb-6" id="print-area">
              <div className="preview-container">
                <div className="mb-2 text-sm text-muted-foreground">
                  Preview: <Link href="/building-other-structure" className="text-blue-600 hover:underline">/building-other-structure</Link>
                </div>
                <div className="border p-2 bg-white">
                  <iframe
                    ref={iframeRef}
                    src="/building-other-structure"
                    title="Building Structure Preview"
                    className="w-full border"
                    style={{ height: iframeHeight }}
                    onLoad={handleIframeLoad}
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    The form content is loaded in the iframe above. Review all information before submitting.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
              <Button 
                onClick={() => router.push('/building-other-structure/fill/step-5')} 
                variant="outline"
                className="w-full sm:w-auto"
              >
                Back to Edit
              </Button>

              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button 
                  onClick={handleSaveDraft}
                  variant="outline"
                  disabled={isSaving || isSubmitting}
                  className="w-full sm:w-auto"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save as Draft
                    </>
                  )}
                </Button>

                <Button 
                  onClick={handleSubmit}
                  disabled={isSaving || isSubmitting}
                  className="w-full sm:w-auto rpfaas-fill-button-primary"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Submit Form
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="mt-4 text-sm text-muted-foreground text-center">
              <p><strong>Save as Draft:</strong> Save your progress and continue editing later.</p>
              <p><strong>Submit Form:</strong> Submit for review. You won't be able to edit after submission.</p>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
