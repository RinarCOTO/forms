// Utility hook to load draft data from API when editing
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export function useLoadDraft() {
  const searchParams = useSearchParams();
  const draftId = searchParams.get('id');
  const [isLoading, setIsLoading] = useState(false);
  const [draftData, setDraftData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!draftId) return;

    const loadDraft = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/building-structure/${draftId}`);
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            setDraftData(result.data);
            
            // Populate localStorage with draft data
            Object.entries(result.data).forEach(([key, value]) => {
              if (value !== null && value !== undefined) {
                // Determine which page this field belongs to based on the key
                const pageMapping: Record<string, string> = {
                  'arp_no': '_p1',
                  'pin': '_p1',
                  'owner_name': '_p2',
                  'owner_address': '_p2',
                  'type_of_building': '_p2',
                  'number_of_storeys': '_p2',
                  'date_constructed': '_p2',
                  'total_floor_area': '_p2',
                  'roofing_material': '_p3',
                  'wall_material': '_p3',
                  'flooring_material': '_p3',
                  'ceiling_material': '_p3',
                  'construction_type': '_p4',
                  'structure_type': '_p4',
                  'foundation_type': '_p4',
                  'electrical_system': '_p4',
                  'plumbing_system': '_p4',
                  'building_permit_no': '_p4',
                  'actual_use': '_p5',
                  'market_value': '_p5',
                  'assessment_level': '_p5',
                  'estimated_value': '_p5',
                  'amount_in_words': '_p5',
                };
                
                const pageSuffix = pageMapping[key] || '_p1';
                
                // Handle complex objects (like roofing_material) properly
                let valueToStore: string;
                if (typeof value === 'object') {
                  valueToStore = JSON.stringify(value);
                } else {
                  valueToStore = String(value);
                }
                
                localStorage.setItem(`${key}${pageSuffix}`, valueToStore);
              }
            });
            
            // Store the draft ID for later use
            localStorage.setItem('draft_id', draftId);
            
            console.log('Draft loaded successfully:', result.data);
          } else {
            setError('Failed to load draft');
          }
        } else {
          setError('Draft not found');
        }
      } catch (err) {
        console.error('Error loading draft:', err);
        setError('Error loading draft');
      } finally {
        setIsLoading(false);
      }
    };

    loadDraft();
  }, [draftId]);

  return { isLoading, draftData, error, draftId };
}
