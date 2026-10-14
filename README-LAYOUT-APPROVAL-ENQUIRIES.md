# Frontend updates

- Existing `LayoutFiltersBar` now supports dependent State → District → Taluka → Village dropdowns and Survey/Gat Number input without adding a separate `DependentLocationFilters` component.
- `/admin/login` is the dedicated admin login entry and `/admin` redirects there; both use the existing auth flow.
- Dashboard → Layouts has Super Admin approval status filtering and Approve & Publish / Reject actions.
- Layout edit form supports State, District, Taluka, Village, Survey/Gat Number and Amenities. Existing layout document controls remain in the layout detail page.
- Public layout details display saved custom amenities.
- Enquiry details include layout/plot location context and a WhatsApp response link with a Google Maps URL where available. The public layout enquiry form includes a WhatsApp share button for layout/plot details and a Maps link.

Location dropdowns use values saved on layouts. The State dropdown includes all Indian states and Union Territories; district/taluka/village choices are based on available layout records.
