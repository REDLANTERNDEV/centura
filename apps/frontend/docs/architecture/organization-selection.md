# 🏢 Multi-Tenant Organization Selection - Professional Implementation

## 📋 Overview

This implementation follows **industry best practices** from leading SaaS companies like:

- 💼 **Salesforce** - Organization/Account switching
- 🔧 **Slack** - Workspace selection
- 📊 **HubSpot** - Portal switching
- 🎯 **Asana** - Workspace management
- 📅 **Monday.com** - Account switching

---

## 🎯 User Flow

### **Login → Organization Selection → Dashboard**

```
1. User logs in successfully
   ↓
2. OrganizationContext fetches user's organizations
   ↓
3. Decision Point:
   - Has 0 orgs → Show "Create Organization" screen
   - Has 1 org → Auto-select and go to dashboard
   - Has 2+ orgs:
     • Check localStorage for last selected org
     • If found → Auto-select it
     • If not found → Show organization selector
   ↓
4. Once organization is selected:
   - Store in localStorage (persists across sessions)
   - Store in React state (for app-wide access)
   - Redirect to dashboard
   ↓
5. Dashboard loads with full UI:
   - Sidebar with navigation
   - Header with organization switcher
   - Main content area
```

---

## 🏗️ Architecture

### **Components Created**

#### 1. **OrganizationContext** (`lib/contexts/OrganizationContext.tsx`)

- Global state management for organization selection
- Fetches user's organizations on mount
- Persists selection to localStorage
- Auto-selects if user has only one organization
- Provides `useOrganization()` hook for all components

#### 2. **OrganizationSelector** (`components/OrganizationSelector.tsx`)

- Full-screen organization selection interface
- Displays all organizations user has access to
- Shows user's role in each organization
- Option to create new organization
- Beautiful, professional UI with cards

#### 3. **OrganizationSwitcher** (`components/OrganizationSwitcher.tsx`)

- Dropdown component for header/sidebar
- Quick switching between organizations
- Shows current organization
- Displays user's role
- Accessible from anywhere in the app

#### 4. **DashboardLayout** (`components/DashboardLayout.tsx`)

- Professional sidebar + header layout
- Includes OrganizationSwitcher in sidebar
- Navigation menu with icons
- Mobile-responsive with hamburger menu
- Only shows when organization is selected

---

## 🔄 How It Works

### **Context Provider Pattern**

```tsx
// Wraps the entire dashboard
<OrganizationProvider>
  <DashboardLayoutClient>{children}</DashboardLayoutClient>
</OrganizationProvider>
```

### **Organization Selection Logic**

```typescript
// In OrganizationContext
useEffect(() => {
  const orgs = await fetchOrganizations();

  if (orgs.length === 1) {
    // Auto-select single org
    selectOrganization(orgs[0]);
  } else if (orgs.length > 1) {
    // Try to restore from localStorage
    const saved = localStorage.getItem('centura_selected_organization');
    if (saved) {
      const org = orgs.find(o => o.id === JSON.parse(saved).id);
      if (org) selectOrganization(org);
    }
  }
}, []);
```

### **Conditional Rendering in Dashboard**

```tsx
export default function DashboardPage() {
  const { selectedOrganization, isLoading } = useOrganization();

  if (isLoading) return <LoadingSpinner />;
  if (!selectedOrganization) return <OrganizationSelector />;

  // Show actual dashboard content
  return <DashboardContent />;
}
```

---

## 🎨 Professional Features

### ✅ **Smart Auto-Selection**

- Single organization → Auto-select
- Multiple organizations → Remember last selection
- No organizations → Prompt to create one

### ✅ **Persistent Selection**

- Stored in `localStorage`
- Survives page refresh
- Validates against current organizations

### ✅ **Organization Context**

- Available everywhere via `useOrganization()` hook
- All API calls can use `selectedOrganization.id`
- Easy to implement org-based filtering

### ✅ **Quick Switching**

- Dropdown in sidebar
- No page navigation required
- Instant switch with `router.refresh()`

### ✅ **Role Display**

- Shows user's role in each org
- Visual badges (owner, admin, user, etc.)
- Permission-aware UI (future enhancement)

### ✅ **Mobile Responsive**

- Collapsible sidebar on mobile
- Touch-friendly organization cards
- Hamburger menu navigation

---

## 📝 Usage Examples

### **Using Organization Context in Components**

```tsx
'use client';

import { useOrganization } from '@/lib/contexts/OrganizationContext';

export default function CustomersPage() {
  const { selectedOrganization } = useOrganization();

  // Fetch data for current organization
  useEffect(() => {
    if (selectedOrganization) {
      fetchCustomers(selectedOrganization.id);
    }
  }, [selectedOrganization]);

  return <div>Customers for {selectedOrganization?.name}</div>;
}
```

### **Making Org-Scoped API Calls**

```tsx
// All API calls automatically include cookies with org context
const response = await apiClient.get('/api/v1/customers', {
  params: {
    organizationId: selectedOrganization.id,
  },
});
```

### **Conditional UI Based on Role**

```tsx
const { selectedOrganization } = useOrganization();
const isAdmin = ['org_owner', 'org_admin'].includes(selectedOrganization?.role);

return (
  <div>
    {isAdmin && <AdminPanel />}
    <UserPanel />
  </div>
);
```

---

## 🔐 Security Considerations

### **Backend Validation**

✅ All API endpoints validate organization access via `user_organization_roles`
✅ User can only see/modify data they have access to
✅ Role-based permissions enforced on backend

### **Frontend Context**

✅ Organization context is client-side only for UX
✅ Never trust frontend for authorization
✅ Backend always validates org access

---

## 🚀 What Professional Companies Do

### **Slack Pattern**

```
1. Login → Show workspace selector
2. Select workspace → Load workspace UI
3. Workspace switcher in top-left corner
4. Recent workspaces saved
```

### **Salesforce Pattern**

```
1. Login → Auto-select last org
2. Organization switcher in header
3. Can switch without losing work
4. Org context affects all data/views
```

### **GitHub Pattern**

```
1. Login → Show user/org switcher
2. Context switcher in top navigation
3. URL includes organization: /org/repo
4. Easy switching between personal/orgs
```

### **Our Implementation** (Best of all)

```
✅ Auto-select single org (like Salesforce)
✅ Persistent selection (like Slack)
✅ Full-screen selector (like Slack)
✅ Quick switcher in sidebar (like GitHub)
✅ Role-aware UI (enterprise feature)
```

---

## 📊 API Integration

### **Backend Endpoints Used**

```javascript
// Get user's organizations
GET /api/v1/organizations/me
Response: { data: [{ id, name, role, ... }] }

// The backend automatically:
✅ Filters organizations by user access
✅ Includes user's role in each org
✅ Returns only active organizations
```

### **How Context Syncs with Backend**

```
1. Component mounts
2. useEffect calls fetchOrganizations()
3. GET /api/v1/organizations/me
4. Store orgs in state
5. Apply auto-selection logic
6. Update localStorage
```

---

## 🎯 Next Steps & Enhancements

### **Immediate Next Steps**

1. ✅ Test the flow (login → select org → dashboard)
2. ✅ Create organization page (`/organizations/create`)
3. ✅ Add organization management pages
4. ✅ Implement role-based UI permissions

### **Future Enhancements**

- [ ] Organization search in switcher
- [ ] Recently accessed organizations
- [ ] Favorite/pinned organizations
- [ ] Organization settings page
- [ ] Invite users to organization
- [ ] Transfer organization ownership
- [ ] Organization analytics dashboard
- [ ] Multi-org comparison views

---

## 🔧 Troubleshooting

### **Organization selector keeps showing**

- Check browser localStorage for `centura_selected_organization`
- Verify `/api/v1/organizations/me` returns organizations
- Check browser console for errors

### **Sidebar not showing**

- Ensure organization is selected
- Check `selectedOrganization` in OrganizationContext
- Verify OrganizationProvider wraps the layout

### **Organization switcher dropdown not working**

- Check if `selectedOrganization` exists
- Verify organizations array has data
- Check for JavaScript errors in console

---

## 📚 File Structure

```
apps/frontend/
├── lib/
│   └── contexts/
│       └── OrganizationContext.tsx        # Global org state
├── components/
│   ├── OrganizationSelector.tsx           # Full-screen selector
│   ├── OrganizationSwitcher.tsx           # Header dropdown
│   └── DashboardLayout.tsx                # Main layout w/ sidebar
└── app/
    └── (dashboard)/
        ├── layout.tsx                      # Wraps with OrganizationProvider
        └── dashboard/
            └── page.tsx                    # Shows selector or dashboard
```

---

## 🎉 Summary

This implementation provides a **professional, enterprise-grade** organization selection system that:

✅ Follows industry best practices  
✅ Provides excellent UX (auto-select, persistence, quick switching)  
✅ Is secure (backend validation, role-aware)  
✅ Is scalable (supports unlimited orgs per user)  
✅ Is mobile-responsive  
✅ Is easy to maintain and extend

Your users will have the same smooth experience as Slack, Salesforce, or HubSpot! 🚀
