# Task Breakdown: Admin Panel Development

## Phase 4.1: Authentication & Layout

### Task 4.1.1: Admin Login Page
**Estimated Time**: 3 hours
**Priority**: Critical
**Dependencies**: Backend 2.1.2, Phase 1.4 complete

- [ ] Create LoginPage component
- [ ] Implement login form
  - Email field
  - Password field
  - "Remember me" checkbox
  - Login button
- [ ] Add form validation (React Hook Form)
- [ ] Connect to auth API
- [ ] Store JWT token in localStorage/sessionStorage
- [ ] Navigate to dashboard on success
- [ ] Display error messages
- [ ] Style with UI library (Ant Design/MUI)
- [ ] Test in different browsers

**Acceptance Criteria:**
- Can login with admin credentials
- Token stored securely
- Error handling working
- Redirects to dashboard

---

### Task 4.1.2: Main Layout Component
**Estimated Time**: 4 hours
**Priority**: Critical
**Dependencies**: 4.1.1

- [ ] Create MainLayout component
- [ ] Implement sidebar navigation
  - Dashboard
  - Schools
  - Meal Plans
  - Subscriptions
  - Orders
  - Users
  - Pause Requests
  - Deliveries
  - Reports
  - CMS
  - Settings
- [ ] Implement header
  - Admin name
  - Logout button
  - Notifications icon (future)
- [ ] Add collapsible sidebar for mobile
- [ ] Style with responsive design
- [ ] Add active menu item highlighting
- [ ] Test on different screen sizes

**Acceptance Criteria:**
- Sidebar navigation working
- Responsive layout
- Header with user menu
- Active menu highlighting

---

### Task 4.1.3: Protected Routes Setup
**Estimated Time**: 2 hours
**Priority**: Critical
**Dependencies**: 4.1.1, 4.1.2

- [ ] Create PrivateRoute component
- [ ] Check for valid JWT token
- [ ] Verify admin role
- [ ] Redirect to login if unauthenticated
- [ ] Implement token refresh logic
- [ ] Add Axios interceptors
  - Add auth header
  - Handle 401 errors
  - Refresh token automatically
- [ ] Test authentication flow

**Acceptance Criteria:**
- Protected routes require auth
- Unauthenticated users redirected to login
- Token refresh working

---

## Phase 4.2: Dashboard

### Task 4.2.1: Dashboard Page
**Estimated Time**: 5 hours
**Priority**: High
**Dependencies**: Backend 2.8.1, 4.1.2

- [ ] Create DashboardPage component
- [ ] Implement statistics cards
  - Active Subscriptions count
  - Today's Deliveries count
  - Monthly Revenue
  - Pending Pause Requests
  - Active Schools count
- [ ] Add loading skeletons
- [ ] Connect to dashboard API
- [ ] Add auto-refresh (every 5 minutes)
- [ ] Style with grid layout
- [ ] Add icons to cards
- [ ] Test data updates

**Acceptance Criteria:**
- Shows key metrics
- Auto-refresh working
- Loading states smooth
- Responsive layout

---

### Task 4.2.2: Recent Activity Section
**Estimated Time**: 3 hours
**Priority**: Medium
**Dependencies**: 4.2.1

- [ ] Add recent subscriptions list
  - Last 5 subscriptions
  - Show student, school, date
  - Link to details
- [ ] Add recent orders list
  - Last 5 orders
  - Show amount, status
  - Link to details
- [ ] Connect to APIs
- [ ] Style as cards or table
- [ ] Test navigation

**Acceptance Criteria:**
- Shows recent activity
- Links working
- Data accurate

---

## Phase 4.3: Schools Management

### Task 4.3.1: Schools List Page
**Estimated Time**: 4 hours
**Priority**: High
**Dependencies**: Backend 2.3.1, 4.1.2

- [ ] Create SchoolsListPage component
- [ ] Implement data table (Ant Design Table / MUI DataGrid)
  - School name
  - Code
  - City
  - Service available status
  - Actions (edit, toggle service)
- [ ] Add search bar
- [ ] Add city filter
- [ ] Add "Service Available" filter
- [ ] Add pagination
- [ ] Add "Add School" button
- [ ] Connect to schools API using React Query
- [ ] Handle loading and error states
- [ ] Test pagination and filters

**Acceptance Criteria:**
- Shows schools in table format
- Search and filters working
- Pagination working
- Can navigate to add/edit

---

### Task 4.3.2: Add School Page
**Estimated Time**: 4 hours
**Priority**: High
**Dependencies**: Backend 2.3.1, 4.3.1

- [ ] Create SchoolCreatePage component
- [ ] Implement form
  - School name
  - School code
  - Address, city, state, pincode
  - Contact email, phone
  - Operating days (multi-select)
  - Delivery instructions (textarea)
- [ ] Add form validation
  - Required fields
  - Email format
  - Phone format
  - Unique school code
- [ ] Connect to create school API
- [ ] Show success message
- [ ] Navigate to schools list on success
- [ ] Handle error messages
- [ ] Test form submission

**Acceptance Criteria:**
- Can create new school
- Validation working
- Success feedback shown
- Data saved correctly

---

### Task 4.3.3: Edit School Page
**Estimated Time**: 3 hours
**Priority**: High
**Dependencies**: Backend 2.3.1, 4.3.2

- [ ] Create SchoolEditPage component
- [ ] Reuse form from create page
- [ ] Fetch school data on load
- [ ] Pre-populate form fields
- [ ] Connect to update school API
- [ ] Show success message
- [ ] Handle errors
- [ ] Test update functionality

**Acceptance Criteria:**
- Can edit existing school
- Data loaded correctly
- Updates saved
- Validation working

---

### Task 4.3.4: Toggle School Service Availability
**Estimated Time**: 2 hours
**Priority**: Medium
**Dependencies**: Backend 2.3.1, 4.3.1

- [ ] Add toggle switch in schools table
- [ ] Implement API call on toggle
- [ ] Show confirmation dialog
- [ ] Update table on success
- [ ] Handle errors
- [ ] Test toggle functionality

**Acceptance Criteria:**
- Can enable/disable school service
- Confirmation required
- Table updates immediately

---

## Phase 4.4: Meal Plans Management

### Task 4.4.1: Meal Plans List Page
**Estimated Time**: 4 hours
**Priority**: High
**Dependencies**: Backend 2.3.2, 4.1.2

- [ ] Create MealPlansListPage component
- [ ] Implement data table
  - Meal plan name
  - School name
  - Type (Breakfast, Lunch, etc.)
  - Duration (days)
  - Price
  - Active status
  - Actions (edit, manage menu, delete)
- [ ] Add school filter dropdown
- [ ] Add type filter
- [ ] Add search bar
- [ ] Add pagination
- [ ] Add "Add Meal Plan" button
- [ ] Connect to meal plans API
- [ ] Test filters and search

**Acceptance Criteria:**
- Shows meal plans in table
- Filters working
- Can navigate to add/edit/menu

---

### Task 4.4.2: Add Meal Plan Page
**Estimated Time**: 4 hours
**Priority**: High
**Dependencies**: Backend 2.3.2, 4.4.1

- [ ] Create MealPlanCreatePage component
- [ ] Implement form
  - School selection dropdown
  - Plan name
  - Description (rich text editor optional)
  - Plan type (dropdown)
  - Duration (number input)
  - Price per day
  - Total price (auto-calculated)
  - Image upload
- [ ] Add form validation
- [ ] Connect to create meal plan API
- [ ] Handle image upload to S3
- [ ] Show success message
- [ ] Navigate to meal plans list
- [ ] Test form submission

**Acceptance Criteria:**
- Can create meal plan
- Image upload working
- Price calculation automatic
- Validation working

---

### Task 4.4.3: Edit Meal Plan Page
**Estimated Time**: 3 hours
**Priority**: High
**Dependencies**: Backend 2.3.2, 4.4.2

- [ ] Create MealPlanEditPage component
- [ ] Reuse form from create page
- [ ] Fetch meal plan data
- [ ] Pre-populate form
- [ ] Connect to update API
- [ ] Handle image update
- [ ] Show success message
- [ ] Test update functionality

**Acceptance Criteria:**
- Can edit meal plan
- Image update working
- Data saved correctly

---

### Task 4.4.4: Menu Management Page
**Estimated Time**: 5 hours
**Priority**: High
**Dependencies**: Backend 2.3.3, 4.4.1

- [ ] Create MenuManagementPage component
- [ ] Display meal plan details at top
- [ ] Implement menu items table
  - Day of week / Day number
  - Items list
  - Calories
  - Allergen info
  - Actions (edit, delete)
- [ ] Add "Add Menu Item" button
- [ ] Implement add/edit menu item modal
  - Day of week selection
  - Items (textarea or tag input)
  - Description
  - Calories (number)
  - Allergen info
  - Image upload
- [ ] Connect to menu items APIs
- [ ] Handle add/edit/delete
- [ ] Test CRUD operations

**Acceptance Criteria:**
- Can add menu items
- Can edit menu items
- Can delete menu items
- Images upload working

---

## Phase 4.5: Subscriptions Management

### Task 4.5.1: Subscriptions List Page
**Estimated Time**: 5 hours
**Priority**: High
**Dependencies**: Backend 2.4.3, 4.1.2

- [ ] Create SubscriptionsListPage component
- [ ] Implement data table
  - Subscription number
  - Parent name
  - Student name
  - School name
  - Meal plan name
  - Start date
  - End date
  - Status
  - Remaining days
  - Amount
  - Actions (view details)
- [ ] Add status filter (all, pending, active, paused, completed, cancelled)
- [ ] Add school filter
- [ ] Add date range filter
- [ ] Add search by subscription number
- [ ] Add pagination
- [ ] Connect to subscriptions API
- [ ] Test filters and search

**Acceptance Criteria:**
- Shows all subscriptions
- Filters working
- Search working
- Pagination working
- Can view details

---

### Task 4.5.2: Subscription Detail Page
**Estimated Time**: 4 hours
**Priority**: High
**Dependencies**: Backend 2.4.3, 4.5.1

- [ ] Create SubscriptionDetailPage component
- [ ] Display subscription details
  - Subscription number, status
  - Parent and student info
  - School and meal plan info
  - Start date, original end date, current end date
  - Total days, delivered, paused, remaining
  - Amount paid
  - Created date
- [ ] Display delivery schedule
  - Calendar or table view
  - Show each date with status
- [ ] Display pause requests (if any)
  - Show all related pause requests
- [ ] Display order information
  - Payment details
  - Transaction info
- [ ] Connect to subscription detail API
- [ ] Test data display

**Acceptance Criteria:**
- Shows complete subscription info
- Schedule displayed clearly
- Pause requests visible
- Order info accurate

---

## Phase 4.6: Orders Management

### Task 4.6.1: Orders List Page
**Estimated Time**: 4 hours
**Priority**: High
**Dependencies**: Backend 2.6.3, 4.1.2

- [ ] Create OrdersListPage component
- [ ] Implement data table
  - Order number
  - Parent name
  - Subscription number
  - Amount
  - Payment status
  - Payment method
  - Date
  - Actions (view details)
- [ ] Add payment status filter
- [ ] Add date range filter
- [ ] Add search by order number
- [ ] Add pagination
- [ ] Add export button (CSV)
- [ ] Connect to orders API
- [ ] Test filters and search

**Acceptance Criteria:**
- Shows all orders
- Filters working
- Search working
- Export working

---

### Task 4.6.2: Order Detail Page
**Estimated Time**: 3 hours
**Priority**: Medium
**Dependencies**: Backend 2.6.3, 4.6.1

- [ ] Create OrderDetailPage component
- [ ] Display order information
  - Order number
  - Parent details
  - Subscription details
  - Amount breakdown
  - Payment status, method
  - Payment gateway order ID
  - Transaction details
  - Date and time
- [ ] Display payment transactions list
  - Transaction ID
  - Gateway transaction ID
  - Status
  - Amount
  - Date
- [ ] Add "Refund" button (future feature)
- [ ] Connect to order detail API
- [ ] Test data display

**Acceptance Criteria:**
- Shows complete order details
- Transaction history visible
- Data accurate

---

## Phase 4.7: Users Management

### Task 4.7.1: Users List Page
**Estimated Time**: 4 hours
**Priority**: Medium
**Dependencies**: Backend 2.8.3, 4.1.2

- [ ] Create UsersListPage component
- [ ] Implement data table
  - Name
  - Email
  - Phone
  - Role
  - Status (active/inactive)
  - Email verified
  - Created date
  - Actions (view details, deactivate)
- [ ] Add role filter
- [ ] Add status filter
- [ ] Add search by email/phone
- [ ] Add pagination
- [ ] Connect to users API
- [ ] Test filters and search

**Acceptance Criteria:**
- Shows all users
- Filters working
- Search working
- Pagination working

---

### Task 4.7.2: User Detail Page
**Estimated Time**: 3 hours
**Priority**: Low
**Dependencies**: Backend 2.8.3, 4.7.1

- [ ] Create UserDetailPage component
- [ ] Display user information
  - Name, email, phone, role
  - Status, verification status
  - Created date, last login
- [ ] Display user's students list
- [ ] Display user's subscriptions list
- [ ] Display user's orders list
- [ ] Add "Activate/Deactivate Account" button
- [ ] Connect to user detail API
- [ ] Test data display

**Acceptance Criteria:**
- Shows complete user profile
- Related data displayed
- Can activate/deactivate account

---

## Phase 4.8: Pause Requests Management

### Task 4.8.1: Pause Requests Page
**Estimated Time**: 5 hours
**Priority**: High
**Dependencies**: Backend 2.5.1, 2.5.2, 4.1.2

- [ ] Create PauseRequestsPage component
- [ ] Implement data table
  - Request ID
  - Parent name
  - Student name
  - Subscription number
  - Pause from date
  - Pause to date
  - Days to pause
  - Reason
  - Status (pending, approved, rejected, processed)
  - Requested date
  - Actions (approve, reject, view details)
- [ ] Add status filter (pending, approved, rejected)
- [ ] Add date range filter
- [ ] Add search
- [ ] Add pagination
- [ ] Implement approve action
  - Show confirmation dialog
  - Call approve API
  - Show new end date impact
  - Update table on success
- [ ] Implement reject action
  - Show confirmation dialog
  - Call reject API
  - Update table on success
- [ ] Connect to pause requests API
- [ ] Test approval/rejection flow

**Acceptance Criteria:**
- Shows all pause requests
- Pending requests highlighted
- Can approve/reject requests
- Status updates in real-time

---

## Phase 4.9: Deliveries Management

### Task 4.9.1: Deliveries Page
**Estimated Time**: 5 hours
**Priority**: High
**Dependencies**: Backend 2.8.2, 4.1.2

- [ ] Create DeliveriesPage component
- [ ] Add date picker (default: today)
- [ ] Add school filter dropdown
- [ ] Implement deliveries table
  - Student name
  - Grade
  - School name
  - Meal plan name
  - Subscription number
  - Delivery status
  - Parent contact (phone)
  - Notes
- [ ] Add "Export" button (PDF/CSV)
  - Generate printable delivery list
  - Group by school
- [ ] Add "Mark as Delivered" bulk action
  - Select multiple deliveries
  - Mark all as delivered
- [ ] Connect to deliveries API
- [ ] Test filtering and export

**Acceptance Criteria:**
- Shows deliveries for selected date/school
- Can filter by school
- Export working (PDF/CSV)
- Bulk actions working

---

## Phase 4.10: Reports

### Task 4.10.1: Sales Report Page
**Estimated Time**: 5 hours
**Priority**: Medium
**Dependencies**: Backend 2.8.4, 4.1.2

- [ ] Create SalesReportPage component
- [ ] Add filters
  - Date range picker
  - School filter
- [ ] Display summary cards
  - Total revenue
  - Total subscriptions
  - Average order value
- [ ] Display school-wise breakdown table
  - School name
  - Revenue
  - Subscription count
- [ ] Add chart (optional)
  - Revenue over time (line chart)
  - Revenue by school (bar chart)
- [ ] Add "Export" button (CSV/PDF)
- [ ] Connect to sales report API
- [ ] Add loading states
- [ ] Test with different date ranges

**Acceptance Criteria:**
- Shows sales data accurately
- Filters working
- Charts display (if implemented)
- Export working

---

### Task 4.10.2: Subscriptions Report Page
**Estimated Time**: 4 hours
**Priority**: Low
**Dependencies**: Backend 2.8.4, 4.1.2

- [ ] Create SubscriptionsReportPage component
- [ ] Add filters
  - Date range
  - School
  - Status
- [ ] Display summary
  - Active subscriptions by school
  - Subscription trends (daily/weekly/monthly)
- [ ] Display table
  - Date
  - New subscriptions
  - Completed subscriptions
  - Cancelled subscriptions
- [ ] Add chart (optional)
  - Subscriptions over time
- [ ] Add export button
- [ ] Connect to subscriptions report API
- [ ] Test with different filters

**Acceptance Criteria:**
- Shows subscription trends
- Filters working
- Export working

---

## Phase 4.11: CMS Management

### Task 4.11.1: CMS Pages List
**Estimated Time**: 3 hours
**Priority**: Low
**Dependencies**: Backend 2.9.1, 4.1.2

- [ ] Create CMSListPage component
- [ ] Implement pages table
  - Slug
  - Title
  - Version
  - Published status
  - Last updated
  - Actions (edit, publish/unpublish)
- [ ] Add "Add Page" button
- [ ] Add search by slug/title
- [ ] Connect to CMS API
- [ ] Test CRUD operations

**Acceptance Criteria:**
- Shows CMS pages list
- Can add/edit pages
- Can publish/unpublish

---

### Task 4.11.2: CMS Page Editor
**Estimated Time**: 5 hours
**Priority**: Low
**Dependencies**: Backend 2.9.1, 4.11.1

- [ ] Create CMSEditorPage component
- [ ] Add slug input
- [ ] Add title input
- [ ] Add rich text editor for content
  - Use TinyMCE, Quill, or Draft.js
  - Support formatting, images, links
- [ ] Add preview mode
- [ ] Add "Save Draft" button
- [ ] Add "Publish" button
- [ ] Connect to CMS APIs
- [ ] Handle version increment
- [ ] Test content creation/editing

**Acceptance Criteria:**
- Can create/edit CMS pages
- Rich text editor working
- Preview mode functional
- Can save and publish

---

## Phase 4.12: UI/UX Polish

### Task 4.12.1: Responsive Design
**Estimated Time**: 4 hours
**Priority**: Medium
**Dependencies**: All pages complete

- [ ] Test all pages on mobile/tablet
- [ ] Fix layout issues on smaller screens
- [ ] Make tables responsive (horizontal scroll or card view)
- [ ] Test sidebar collapse on mobile
- [ ] Ensure forms usable on mobile

**Acceptance Criteria:**
- Admin panel usable on tablet
- Layout doesn't break on small screens
- Mobile-friendly (even if not primary use case)

---

### Task 4.12.2: Loading States & Skeletons
**Estimated Time**: 3 hours
**Priority**: Medium
**Dependencies**: All pages complete

- [ ] Add loading skeletons to tables
- [ ] Add loading spinners to buttons
- [ ] Add loading states to charts
- [ ] Ensure consistent loading UX
- [ ] Test loading states

**Acceptance Criteria:**
- Loading states visible on data fetching
- Skeletons provide good UX
- No flash of empty content

---

### Task 4.12.3: Error Handling & Messages
**Estimated Time**: 3 hours
**Priority**: Medium
**Dependencies**: All pages complete

- [ ] Add error messages to forms
- [ ] Add error states to data tables (with retry button)
- [ ] Add toast notifications for success/error
  - Success: green toast
  - Error: red toast
  - Info: blue toast
- [ ] Add confirmation dialogs for destructive actions
  - Delete
  - Deactivate
  - Reject
- [ ] Test error scenarios

**Acceptance Criteria:**
- Error messages clear and helpful
- Confirmation dialogs prevent mistakes
- Toast notifications work

---

### Task 4.12.4: Accessibility & Keyboard Navigation
**Estimated Time**: 2 hours
**Priority**: Low
**Dependencies**: All pages complete

- [ ] Ensure proper semantic HTML
- [ ] Add aria labels where needed
- [ ] Test keyboard navigation
  - Tab through forms
  - Use Enter to submit
  - Use Escape to close modals
- [ ] Test with screen reader (basic)
- [ ] Ensure color contrast sufficient

**Acceptance Criteria:**
- Keyboard navigation working
- Basic accessibility standards met

---

## Phase 4.13: Testing & Documentation

### Task 4.13.1: Cross-Browser Testing
**Estimated Time**: 3 hours
**Priority**: High
**Dependencies**: All pages complete

- [ ] Test on Chrome
- [ ] Test on Firefox
- [ ] Test on Safari
- [ ] Test on Edge
- [ ] Fix browser-specific issues
- [ ] Test different screen resolutions

**Acceptance Criteria:**
- Works on all major browsers
- No critical bugs
- Consistent appearance

---

### Task 4.13.2: Integration Testing
**Estimated Time**: 4 hours
**Priority**: Medium
**Dependencies**: All pages complete

- [ ] Test all CRUD operations
  - Create school → Create meal plan → Assign menu
  - View subscription → Approve pause request
  - View deliveries → Export
- [ ] Test authentication flow
  - Login → Access pages → Logout
  - Token expiry handling
- [ ] Test filters and search across pages
- [ ] Fix any integration issues

**Acceptance Criteria:**
- All flows working end-to-end
- No broken links or actions
- Data consistency maintained

---

### Task 4.13.3: Admin User Guide
**Estimated Time**: 3 hours
**Priority**: Low
**Dependencies**: All pages complete

- [ ] Create admin user documentation
  - Login instructions
  - How to manage schools
  - How to manage meal plans
  - How to handle pause requests
  - How to view reports
  - How to manage deliveries
- [ ] Add screenshots
- [ ] Create quick reference guide
- [ ] Host documentation (or PDF)

**Acceptance Criteria:**
- Documentation covers all features
- Clear instructions with screenshots
- Easy to follow

---

## Phase 4.14: Deployment Preparation

### Task 4.14.1: Production Build
**Estimated Time**: 2 hours
**Priority**: High
**Dependencies**: All pages complete

- [ ] Configure environment variables
  - API base URL (production)
  - Other config
- [ ] Create production build
  ```bash
  npm run build
  ```
- [ ] Test production build locally
- [ ] Optimize bundle size
  - Code splitting
  - Lazy loading
  - Tree shaking
- [ ] Test build performance

**Acceptance Criteria:**
- Production build successful
- Bundle size optimized
- App works in production mode

---

### Task 4.14.2: Deployment Setup
**Estimated Time**: 3 hours
**Priority**: High
**Dependencies**: 4.14.1

- [ ] Choose hosting platform
  - Vercel / Netlify (recommended for React)
  - AWS S3 + CloudFront
  - DigitalOcean / Heroku
- [ ] Configure deployment
  - Connect to Git repository
  - Set environment variables
  - Configure build command
- [ ] Deploy to staging environment
- [ ] Test staging deployment
- [ ] Set up custom domain (if applicable)
- [ ] Configure SSL certificate

**Acceptance Criteria:**
- Admin panel deployed successfully
- Accessible via URL
- HTTPS enabled
- Works correctly in production

---

## Summary

**Total Estimated Time**: ~110 hours (3-4 weeks with 1-2 developers)

**Critical Path**:
Auth (4.1) → Layout (4.1.2) → Dashboard (4.2) → Schools (4.3) → Meals (4.4) → Subscriptions (4.5) → Pause Requests (4.8) → Deliveries (4.9)

**Deliverables:**
- ✅ Complete admin panel web application
- ✅ All admin features implemented
- ✅ Responsive design
- ✅ Data visualization (tables, optional charts)
- ✅ Export functionality
- ✅ Tested across browsers
- ✅ Production deployment
- ✅ Admin documentation

**Next Phase**: Testing & Deployment (Overall System)
