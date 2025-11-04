'use client';

/**
 * Organization Context
 * Manages the currently selected organization across the app
 *
 * Professional companies like Salesforce, Slack, HubSpot use this pattern:
 * 1. User logs in
 * 2. Fetches their organizations
 * 3. Either auto-selects (if only 1) or shows selector
 * 4. Stores selection in localStorage + state
 * 5. All API calls use this organization context
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { apiClient, API_ENDPOINTS } from '@/lib/api-client';

interface Organization {
  org_id: number; // Backend uses org_id
  id: string; // Alias for compatibility (string version of org_id)
  name: string; // Normalized from org_name
  org_name?: string; // Original from backend
  slug?: string;
  description?: string;
  industry?: string;
  role?: string; // User's role in this organization
  is_active?: boolean;
  org_active?: boolean; // Original from backend
  role_active?: boolean;
  created_at?: string;
  updated_at?: string;
  assigned_at?: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
}

interface OrganizationContextType {
  selectedOrganization: Organization | null;
  organizations: Organization[];
  isLoading: boolean;
  error: string | null;
  selectOrganization: (org: Organization) => void;
  fetchOrganizations: () => Promise<void>;
  clearOrganization: () => void;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(
  undefined
);

const ORG_STORAGE_KEY = 'centura_selected_org_id'; // Only store ID, not full object

export function OrganizationProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [selectedOrganization, setSelectedOrganization] =
    useState<Organization | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's organizations from backend
  const fetchOrganizations = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Call /api/v1/organizations to get user's organizations
      const response = await apiClient.get(API_ENDPOINTS.ORGANIZATIONS.LIST);

      // Normalize backend data structure
      // Backend returns: { org_id, org_name, role, org_active, role_active, etc }
      const orgs = (response.data.data || []).map(
        (org: Record<string, unknown>) => ({
          ...org,
          id: org.org_id?.toString() || org.id, // Ensure id exists as string
          name: org.org_name || org.name, // Normalize org_name to name
          is_active: org.org_active ?? org.is_active, // Normalize org_active to is_active
        })
      );

      setOrganizations(orgs);

      // Auto-select logic
      if (orgs.length === 1) {
        // If user has only one org, auto-select it
        selectOrganization(orgs[0]);
      } else if (orgs.length > 1) {
        // Try to restore last selected org from localStorage
        const storedOrgId = localStorage.getItem(ORG_STORAGE_KEY);

        if (storedOrgId) {
          const matchingOrg = orgs.find(
            (org: Organization) => org.org_id?.toString() === storedOrgId
          );
          if (matchingOrg) {
            selectOrganization(matchingOrg);
          }
        }
      }
    } catch (err) {
      const error = err as { message?: string; response?: { status?: number } };
      // eslint-disable-next-line no-console
      console.error('❌ Failed to fetch organizations:', err);
      setError(error.message || 'Failed to load organizations');

      // If unauthorized, clear everything
      if (error.response?.status === 401) {
        setOrganizations([]);
        clearOrganization();
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Select an organization
  const selectOrganization = useCallback((org: Organization) => {
    // eslint-disable-next-line no-console
    console.log('🔐 Selecting organization:', {
      org_id: org.org_id,
      id: org.id,
      name: org.name,
    });

    // SECURITY: Only store org_id (number), not the full object
    // The API interceptor will automatically read this from localStorage
    localStorage.setItem(ORG_STORAGE_KEY, org.org_id.toString());

    // Update state AFTER localStorage is set
    // This ensures the interceptor can read the org_id immediately
    setSelectedOrganization(org);
  }, []);

  // Clear organization (for logout or switching)
  const clearOrganization = useCallback(() => {
    setSelectedOrganization(null);
    localStorage.removeItem(ORG_STORAGE_KEY);
  }, []);

  // Fetch organizations on mount
  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  const value: OrganizationContextType = useMemo(
    () => ({
      selectedOrganization,
      organizations,
      isLoading,
      error,
      selectOrganization,
      fetchOrganizations,
      clearOrganization,
    }),
    [
      selectedOrganization,
      organizations,
      isLoading,
      error,
      selectOrganization,
      fetchOrganizations,
      clearOrganization,
    ]
  );

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}

// Custom hook to use organization context
export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error(
      'useOrganization must be used within an OrganizationProvider'
    );
  }
  return context;
}
