/**
 * Form Storage Utility
 * Handles saving and loading form data from both localStorage (draft) and API (persistent)
 */

export interface FormData {
  [key: string]: any;
}

export interface SavedFormMetadata {
  formId?: string;
  formType: string;
  lastSaved: string;
  status: 'draft' | 'submitted';
  step?: number;
}

/**
 * Save form data to localStorage (for draft saving)
 */
export function saveDraftToLocal(formType: string, step: number, data: FormData): void {
  try {
    const key = `draft_${formType}_step_${step}`;
    const metadata: SavedFormMetadata = {
      formType,
      lastSaved: new Date().toISOString(),
      status: 'draft',
      step,
    };
    
    localStorage.setItem(key, JSON.stringify(data));
    localStorage.setItem(`${key}_metadata`, JSON.stringify(metadata));
    
    console.log(`✅ Draft saved for ${formType} - Step ${step}`);
  } catch (error) {
    console.error('Error saving draft to localStorage:', error);
    throw error;
  }
}

/**
 * Load draft form data from localStorage
 */
export function loadDraftFromLocal(formType: string, step: number): FormData | null {
  try {
    const key = `draft_${formType}_step_${step}`;
    const data = localStorage.getItem(key);
    
    if (!data) return null;
    
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading draft from localStorage:', error);
    return null;
  }
}

/**
 * Get metadata about a saved draft
 */
export function getDraftMetadata(formType: string, step: number): SavedFormMetadata | null {
  try {
    const key = `draft_${formType}_step_${step}_metadata`;
    const metadata = localStorage.getItem(key);
    
    if (!metadata) return null;
    
    return JSON.parse(metadata);
  } catch (error) {
    console.error('Error loading draft metadata:', error);
    return null;
  }
}

/**
 * Clear draft data for a specific form type
 */
export function clearDraft(formType: string, step?: number): void {
  try {
    if (step !== undefined) {
      // Clear specific step
      const key = `draft_${formType}_step_${step}`;
      localStorage.removeItem(key);
      localStorage.removeItem(`${key}_metadata`);
    } else {
      // Clear all steps for this form type
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(`draft_${formType}_`)) {
          localStorage.removeItem(key);
        }
      });
    }
    
    console.log(`🗑️ Draft cleared for ${formType}${step ? ` - Step ${step}` : ''}`);
  } catch (error) {
    console.error('Error clearing draft:', error);
  }
}

/**
 * Save form data to the database (persistent save)
 */
export async function saveFormToDatabase(
  formType: string,
  data: FormData,
  status: 'draft' | 'submitted' = 'draft'
): Promise<{ success: boolean; data?: any; error?: string; formId?: string }> {
  try {
    const endpoint = getApiEndpoint(formType);
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...data,
        status,
      }),
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      // Provide more helpful error messages
      const errorMsg = result.message || result.error || 'Failed to save form';
      
      // Check for common database connection errors
      if (errorMsg.includes("Can't reach database") || errorMsg.includes('ECONNREFUSED')) {
        throw new Error('Database not connected. Please check DATABASE_URL in .env file.');
      }
      
      throw new Error(errorMsg);
    }
    
    console.log(`✅ Form saved to database: ${formType}`);
    
    return {
      success: true,
      data: result.data,
      formId: result.data?.id,
    };
  } catch (error) {
    console.error('Error saving form to database:', error);
    
    // Provide user-friendly error messages
    let errorMessage = 'Failed to save to database';
    
    if (error instanceof Error) {
      if (error.message.includes('Database not connected')) {
        errorMessage = 'Database not available. Use "Save Draft" instead.';
      } else if (error.message.includes('fetch')) {
        errorMessage = 'Network error. Check your connection.';
      } else {
        errorMessage = error.message;
      }
    }
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Update existing form in database
 */
export async function updateFormInDatabase(
  formType: string,
  formId: string,
  data: FormData,
  status: 'draft' | 'submitted' = 'draft'
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const endpoint = `${getApiEndpoint(formType)}/${formId}`;
    
    const response = await fetch(endpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...data,
        status,
      }),
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to update form');
    }
    
    console.log(`✅ Form updated in database: ${formType}`);
    
    return {
      success: true,
      data: result.data,
    };
  } catch (error) {
    console.error('Error updating form in database:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Load form data from database
 */
export async function loadFormFromDatabase(
  formType: string,
  formId: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const endpoint = `${getApiEndpoint(formType)}/${formId}`;
    
    const response = await fetch(endpoint);
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to load form');
    }
    
    return {
      success: true,
      data: result.data,
    };
  } catch (error) {
    console.error('Error loading form from database:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get API endpoint for a form type
 */
function getApiEndpoint(formType: string): string {
  const endpoints: Record<string, string> = {
    'building-structure': '/api/building-structure',
    'land-improvements': '/api/land-improvements',
    'machinery': '/api/machinery',
  };
  
  return endpoints[formType] || `/api/${formType}`;
}

/**
 * Format date for display
 */
export function formatLastSaved(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}
